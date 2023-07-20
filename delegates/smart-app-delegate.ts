import { DeviceWrapper } from "../models/device-wrapper";
import { EntityWrapper } from "../models/entity-wrapper";
import { EventService } from "../services/event-service";
import { InstalledSmartApp } from "../models/installed-smart-app";
import { LocationService } from "../services/location-service";
import { ServiceFactory } from "../services/service-factory";

export class SmartAppDelegate {
  private _eventService: EventService;
  private _locationService: LocationService;
  private _installedSmartApp: InstalledSmartApp;
  private _sandboxMethods: string[] = [
    "getSunriseAndSunset",
    "subscribe",
    "unsubscribe",
    "unschedule",
    "definition",
    "runIn",
  ];

  constructor(
    installedSmartApp: InstalledSmartApp,
    eventService: EventService,
    locationService: LocationService
  ) {
    this._installedSmartApp = installedSmartApp;
    this._eventService = eventService;
    this._locationService = locationService;
  }

  get sandboxMethods() {
    return this._sandboxMethods;
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

  public runIn(
    delayInSeconds: number,
    handlerMethod: string,
    options: any = {}
  ): void {
    ServiceFactory.getInstance()
      .getScheduleService()
      .runIn(
        delayInSeconds,
        "SMARTAPP",
        this._installedSmartApp.id,
        handlerMethod,
        options
      );
  }

  public definition(definitionInfo: any) {
    // this function is empty because we ignore definition in normal running
  }
}
