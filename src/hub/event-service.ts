import { ParrotEvent } from "../entity/models/event";
import { Subscription } from "../entity/models/subscription";
import fs from "fs";
import * as crypto from "crypto";
import YAML from "yaml";
import { EventDataStore } from "./event-data-store";
import { ParrotEventWrapper } from "../entity/models/event-wrapper";

export class EventService {
  private _subscriptionInfo: Map<string, Subscription>;
  private _deviceToSubscriptionMap: Map<string, string[]>;
  private _locationToSubscriptionMap: Map<string, string[]>;

  private _eventDataStore: EventDataStore;

  public constructor(eventDataStore: EventDataStore) {
    this._eventDataStore = eventDataStore;
  }

  getSubscribedSmartApps(event: ParrotEvent): Subscription[] {
    let subscribedApps: Subscription[] = [];

    // look up subscription
    if ("DEVICE" === event.source) {
      let subscriptions: string[] = this.getSubscriptionListForDevice(
        event.sourceId
      );
      if (subscriptions != null && subscriptions.length > 0) {
        subscriptions.forEach((subscriptionId: string) => {
          let subscriptionInfo: Subscription =
            this.getSubscriptionInfoById(subscriptionId);
          if (subscriptionInfo != null) {
            let attributeNameAndValue: string =
              subscriptionInfo.attributeNameAndValue;
            if (
              attributeNameAndValue == null ||
              (event.name != null &&
                (event.name === attributeNameAndValue ||
                  (event.value != null &&
                    event.name + "." + event.value === attributeNameAndValue)))
            ) {
              let handlerMethod: string = subscriptionInfo.handlerMethod;
              let installedAutomationAppId: string =
                subscriptionInfo.subscribedAppId;
              // if subscription has filter events = false or event is a state change
              if (
                (!subscriptionInfo.filterEvents || event.isStateChange()) &&
                handlerMethod != null &&
                installedAutomationAppId != null
              ) {
                subscribedApps.push(subscriptionInfo);
              }
            }
          }
        });
      }
    } else if ("HUB" === event.source || "LOCATION" === event.source) {
      // hub events are location events
      let subscriptions: string[] = Array.from(
        new Set(
          Array.from(this.getLocationToSubscriptionMap().values()).flatMap(
            (arr) => arr
          )
        )
      );
      if (subscriptions != null && subscriptions.length > 0) {
        subscriptions.forEach((subscriptionId: string) => {
          let subscriptionInfo: Subscription =
            this.getSubscriptionInfoById(subscriptionId);
          if (subscriptionInfo != null) {
            let attributeNameAndValue: string =
              subscriptionInfo.attributeNameAndValue;
            if (
              attributeNameAndValue == null ||
              (event.name != null &&
                (event.name === attributeNameAndValue ||
                  (event.value != null &&
                    event.name + "." + event.value === attributeNameAndValue)))
            ) {
              let handlerMethod: string = subscriptionInfo.handlerMethod;
              let installedAutomationAppId: string =
                subscriptionInfo.subscribedAppId;
              if (
                (!subscriptionInfo.filterEvents || event.isStateChange()) &&
                handlerMethod != null &&
                installedAutomationAppId != null
              ) {
                subscribedApps.push(subscriptionInfo);
              }
            }
          }
        });
      }
    }
    return subscribedApps;
  }

  saveEvent(event: ParrotEvent): void {
    //TODO: save event in database
    this._eventDataStore.saveEvent(event);
  }

  public eventsSince(
    source: string,
    sourceId: string,
    date: Date,
    maxEvents: number
  ): ParrotEventWrapper[] {
    let events = this._eventDataStore.eventsSince(
      source,
      sourceId,
      date,
      maxEvents
    );
    return events?.map((evt) => new ParrotEventWrapper(evt));
  }

  public eventsBetween(
    source: string,
    sourceId: string,
    startDate: Date,
    endDate: Date,
    maxEvents: number
  ): ParrotEventWrapper[] {
    let events = this._eventDataStore.eventsBetween(
      source,
      sourceId,
      startDate,
      endDate,
      maxEvents
    );
    return events?.map((evt) => new ParrotEventWrapper(evt));
  }

  public addDeviceSubscription(
    deviceId: string,
    subscribedAppId: string,
    attributeNameAndValue: string,
    handlerMethod: string,
    options: any
  ): void {
    let subscription: Subscription = new Subscription();
    subscription.id = crypto.randomUUID();
    subscription.deviceId = deviceId;
    subscription.attributeNameAndValue = attributeNameAndValue;
    subscription.subscribedAppId = subscribedAppId;
    subscription.handlerMethod = handlerMethod;
    if (options != null && options.hasOwnProperty("filterEvents")) {
      subscription.filterEvents = options["filterEvents"];
    }

    // check for existing subscription
    if (
      !Array.from(this.getSubscriptionInfo().values()).find((s) =>
        subscription.equals(s)
      )
    ) {
      this.getSubscriptionInfo().set(subscription.id, subscription);
      if (subscription.deviceId != null) {
        // if (getDeviceToSubscriptionMap().get(deviceId) == null) {
        //     getDeviceToSubscriptionMap().put(deviceId, new ArrayList<>(Arrays.asList(subscription.getId())));
        // } else {
        //     getDeviceToSubscriptionMap().get(deviceId).add(subscription.getId());
        // }
      }
    }

    this.saveSubscriptionInfo();
  }

  private getSubscriptionListForDevice(deviceId: string): string[] {
    return this.getDeviceToSubscriptionMap().get(deviceId);
  }

  private getSubscriptionInfoById(subscriptionId: string): Subscription {
    return this.getSubscriptionInfo().get(subscriptionId);
  }

  private getSubscriptionInfo(): Map<string, Subscription> {
    if (!this._subscriptionInfo) {
      this.loadSubscriptionInfo();
    }
    return this._subscriptionInfo;
  }

  private getDeviceToSubscriptionMap(): Map<string, string[]> {
    if (this._deviceToSubscriptionMap == null) {
      this.loadSubscriptionInfo();
    }
    return this._deviceToSubscriptionMap;
  }

  private getLocationToSubscriptionMap(): Map<string, string[]> {
    if (this._locationToSubscriptionMap == null) {
      this.loadSubscriptionInfo();
    }
    return this._locationToSubscriptionMap;
  }

  private loadSubscriptionInfo(): void {
    if (this._subscriptionInfo != null) {
      return;
    }
    let tempSubscriptionInfo: Map<string, Subscription> = new Map<
      string,
      Subscription
    >();
    let tempDeviceToSubscriptionMap: Map<string, string[]> = new Map<
      string,
      string[]
    >();
    let tempLocationToSubscriptionMap: Map<string, string[]> = new Map<
      string,
      string[]
    >();

    try {
      if (fs.existsSync("userData/config/subscriptions.yaml")) {
        const data = fs.readFileSync(
          "userData/config/subscriptions.yaml",
          "utf-8"
        );
        if (data) {
          let parsedFile = YAML.parse(data);
          if (parsedFile && Array.isArray(parsedFile)) {
            parsedFile.forEach((sub: Subscription) => {
              tempSubscriptionInfo.set(sub.id, sub);
              if (sub.deviceId) {
                if (!tempDeviceToSubscriptionMap.get(sub.deviceId)) {
                  tempDeviceToSubscriptionMap.set(sub.deviceId, [sub.id]);
                } else {
                  tempDeviceToSubscriptionMap.get(sub.deviceId).push(sub.id);
                }
              } else if (sub.locationId) {
                if (!tempLocationToSubscriptionMap.get(sub.locationId)) {
                  tempLocationToSubscriptionMap.set(sub.locationId, [sub.id]);
                } else {
                  tempLocationToSubscriptionMap
                    .get(sub.locationId)
                    .push(sub.id);
                }
              }
            });
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
    this._subscriptionInfo = tempSubscriptionInfo;
    this._deviceToSubscriptionMap = tempDeviceToSubscriptionMap;
    this._locationToSubscriptionMap = tempLocationToSubscriptionMap;
  }

  private saveSubscriptionInfo(): void {
    if (this._subscriptionInfo != null) {
      try {
        fs.writeFile(
          "userData/config/subscriptions.yaml",
          YAML.stringify(Array.from(this._subscriptionInfo.values())),
          (err: any) => {
            if (err) throw err;
          }
        );
      } catch (err) {
        console.log(err);
      }
    }
  }
}
