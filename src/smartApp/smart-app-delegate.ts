import { DeviceWrapper } from "../device/models/device-wrapper";
import { EntityWrapper } from "../entity/models/entity-wrapper";
import { EventService } from "../hub/event-service";
import { InstalledSmartApp } from "./models/installed-smart-app";
import { LocationService } from "../hub/location-service";
import { EntityDelegate } from "../entity/entity-delegate";
import { SmartAppService } from "./smart-app-service";
import { randomUUID } from "crypto";

export class SmartAppDelegate extends EntityDelegate {
  private _eventService: EventService;
  private _locationService: LocationService;
  private _installedSmartApp: InstalledSmartApp;
  private _smartAppService: SmartAppService;
  private _sandboxMethods: string[] = [
    "getSunriseAndSunset",
    "subscribe",
    "unsubscribe",
    "unschedule",
    "createAccessToken",
    "definition",
    "preferences",
    "mappings",
  ];

  state: any;

  constructor(
    installedSmartApp: InstalledSmartApp,
    eventService: EventService,
    locationService: LocationService,
    smartAppService: SmartAppService
  ) {
    super();
    this._installedSmartApp = installedSmartApp;
    this.state = JSON.parse(JSON.stringify(installedSmartApp.state));
    this._eventService = eventService;
    this._locationService = locationService;
    this._smartAppService = smartAppService;
  }

  get sandboxMethods() {
    return super.sandboxMethods.concat(this._sandboxMethods);
  }

  get entityType(): string {
    return "SMARTAPP";
  }

  get entityId(): string {
    return this._installedSmartApp.id;
  }

  public getSunriseAndSunset(): { sunrise: Date; sunset: Date } {
    return this._locationService.getSunriseAndSunset({});
  }

  subscribe(
    entityOrEntities: any,
    attributeNameAndValue: string,
    handlerMethod: any,
    options: any
  ): void {
    if (entityOrEntities == null || handlerMethod == null) {
      return;
    }

    let handlerMethodName: string;
    if (handlerMethod != null && typeof handlerMethod == "function") {
      handlerMethodName = handlerMethod.name;
    } else if (handlerMethod != null && typeof handlerMethod == "string") {
      handlerMethodName = handlerMethod;
    } else {
      throw new Error("handler method not specified");
    }

    if (entityOrEntities.constructor === Array) {
      if (entityOrEntities.length > 0) {
        //Loop through array and call subscribe
        entityOrEntities.forEach((entity) => {
          if ((entity as EntityWrapper).getType() === "DEVICE") {
            this._eventService.addDeviceSubscription(
              (entity as DeviceWrapper).id,
              this._installedSmartApp.id,
              attributeNameAndValue,
              handlerMethodName,
              options
            );
          }
        });
      }
    } else {
      if ((entityOrEntities as EntityWrapper).getType() === "DEVICE") {
        this._eventService.addDeviceSubscription(
          (entityOrEntities as DeviceWrapper).id,
          this._installedSmartApp.id,
          attributeNameAndValue,
          handlerMethodName,
          options
        );
      }
      //TODO: handle location and hub subscribe
    }
  }

  unsubscribe(entity: any, attributeName: string, handlerMethod: string): void {
    console.log("unsubscribe");
  }

  unschedule(handlerMethod: string): void {
    console.log("unschedule");
  }

  createAccessToken(): string {
    let smartApp = this._smartAppService.getSmartApp(
      this._installedSmartApp.smartAppId
    );
    if (smartApp != null && smartApp.oAuthEnabled) {
      let accessToken: string = randomUUID();
      this.state["accessToken"] = accessToken;
      return accessToken;
    } else {
      throw new Error("OAuth is not enabled");
    }
  }

  public definition(definitionInfo: any) {
    // this function is empty because we ignore definition in normal running
  }
  public preferences(params: any, closure: Function) {
    // this function is empty because we ignore preferences in normal running
  }
  public mappings(closure: Function) {
    // this function is empty because we ignore mappings in normal running
  }
}
