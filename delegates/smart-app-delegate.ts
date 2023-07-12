import { DeviceWrapper } from "../models/device-wrapper";
import { EntityWrapper } from "../models/entity-wrapper";
import { EventService } from "../services/event-service";
import { InstalledSmartApp } from "../models/installed-smart-app";

export class SmartAppDelegate {
  private _eventService: EventService;
  private _installedSmartApp: InstalledSmartApp;
  constructor(
    installedSmartApp: InstalledSmartApp,
    eventService: EventService
  ) {
    this._installedSmartApp = installedSmartApp;
    this._eventService = eventService;
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
}
