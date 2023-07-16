import { Logger } from "./logger-service";
import { DeviceDelegate } from "../delegates/device-delegate";
import { EventService } from "./event-service";
import { Subscription } from "../models/subscription";
import { SmartAppDelegate } from "../delegates/smart-app-delegate";
import { DeviceService } from "./device-service";
import { SmartAppService } from "./smart-app-service";
import { Event } from "../models/event";
import { SmartApp } from "../models/smart-app";
import { Device } from "../models/device";
import { DeviceHandler } from "../models/device-handler";
import { InstalledSmartApp } from "../models/installed-smart-app";
import { InstalledSmartAppSetting } from "../models/installed-smart-app-setting";
import { DeviceWrapper } from "../models/device-wrapper";
import { DeviceSetting } from "../models/device-setting";

const fs = require("fs");
const vm = require("vm");

export class EntityService {
  private deviceService: DeviceService;
  private smartAppService: SmartAppService;
  private eventService: EventService;

  constructor(
    deviceService: DeviceService,
    smartAppService: SmartAppService,
    eventService: EventService
  ) {
    this.deviceService = deviceService;
    this.eventService = eventService;
    this.smartAppService = smartAppService;
  }

  sendDeviceEvent(properties: any, deviceId: string): void {
    console.log("send device event!");
    if (!properties) {
      return;
    }

    let event: Event = new Event(properties);
    event.source = "DEVICE";
    event.sourceId = deviceId;
    this.processEvent(event);
  }

  private processEvent(event: Event): void {
    console.log("process event!", event);
    // skip any events that have a null name
    if (event.name == null) {
      return;
    }

    let subscriptions: Subscription[] =
      this.eventService.getSubscribedSmartApps(event);

    if (
      (subscriptions != null && subscriptions.length > 0) ||
      event.isStateChange()
    ) {
      // save event in database
      this.eventService.saveEvent(event);
      if (event.source == "DEVICE") {
        this.deviceService.updateDeviceState(event);
      }
    }

    // TODO: future functionality to notify any processes that are looking for events.
    //notifyEventListeners(event);

    subscriptions.forEach((subscription: Subscription) => {
      //TODO: create a worker pool for these
      //TODO: create a copy of the event so that this is thread safe.
      this.runSmartAppMethod(
        subscription.subscribedAppId,
        subscription.handlerMethod,
        [event]
      );
    });
  }

  public getDeviceHandlerPreferencesLayout(deviceHandlerId: string): any {
    return this.deviceService.getDeviceHandlerPreferencesLayout(
      deviceHandlerId
    );
  }

  public async runSmartAppMethod(
    id: string,
    methodName: string,
    args: any[]
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        let installedSmartApp: InstalledSmartApp =
          this.smartAppService.getInstalledSmartApp(id);
        let smartApp: SmartApp = this.smartAppService.getSmartApp(
          installedSmartApp.smartAppId
        );

        let retVal = this.runEntityMethod(
          smartApp.file,
          methodName,
          `smartApp_${smartApp.id}`,
          this.buildSmartAppSandbox(installedSmartApp),
          args
        );
        resolve(retVal);
      } catch (error) {
        reject(error);
      }
    });
  }

  private buildSmartAppSandbox(installedSmartApp: InstalledSmartApp): any {
    let sandbox: any = {};
    sandbox["log"] = Logger;
    let smartAppDelegate: SmartAppDelegate = new SmartAppDelegate(
      installedSmartApp,
      this.eventService
    );
    sandbox["subscribe"] = smartAppDelegate.subscribe.bind(smartAppDelegate);
    sandbox["unsubscribe"] =
      smartAppDelegate.unsubscribe.bind(smartAppDelegate);
    sandbox["unschedule"] = smartAppDelegate.unschedule.bind(smartAppDelegate);

    let settingsObject: any = {};
    let settingsHandler = this.buildSmartAppSettingsHandler(installedSmartApp);
    const settingsProxy = new Proxy(settingsObject, settingsHandler);
    sandbox["settings"] = settingsProxy;

    return sandbox;
  }

  protected buildSmartAppSettingsHandler(installedSmartApp: InstalledSmartApp) {
    return {
      settingsCache: {},
      isaSettings: installedSmartApp.settings ? installedSmartApp.settings : [],
      shDeviceService: this.deviceService,
      shEntityService: this,
      get(target: any, prop: any): any {
        let settingLookupVal = this.settingsCache[prop];
        if (typeof settingLookupVal === "undefined") {
          let installedSmartAppSetting: InstalledSmartAppSetting =
            this.isaSettings.find(
              (element: InstalledSmartAppSetting) => element.name == prop
            );
          if (typeof installedSmartAppSetting != "undefined") {
            if (installedSmartAppSetting.type.startsWith("capability")) {
              if (installedSmartAppSetting.value) {
                if (installedSmartAppSetting.multiple) {
                  settingLookupVal = [];
                  JSON.parse(installedSmartAppSetting.value).forEach(
                    (deviceId: string) => {
                      settingLookupVal.push(
                        this.shEntityService.buildDeviceWrapper(
                          this.shDeviceService.getDevice(deviceId)
                        )
                      );
                    }
                  );
                } else {
                  let deviceId = installedSmartAppSetting.value;
                  settingLookupVal = this.shEntityService.buildDeviceWrapper(
                    this.shDeviceService.getDevice(deviceId)
                  );
                }
              } else {
                settingLookupVal = null;
              }
            } else {
              settingLookupVal = installedSmartAppSetting.getValueAsType();
            }
            this.settingsCache[prop] = settingLookupVal;
          }
        }

        return settingLookupVal ? settingLookupVal : null;
      },
    };
  }

  protected buildDeviceWrapper(device: Device) {
    let deviceWrapper = new DeviceWrapper(device, this.deviceService);
    let deviceWrapperHandler = {
      shEntityService: this,
      get(dwTarget: any, dwProp: any, dwReceiver: any): any {
        const origMethod = dwTarget[dwProp];
        if (origMethod) {
          return origMethod;
        } else {
          // probably a call to a command
          //TODO: check if command from device handler
          return function (...args: any[]) {
            this.shEntityService.runDeviceMethod(dwTarget.id, dwProp, args);
          }.bind(this);
        }
      },
    };
    return new Proxy(deviceWrapper, deviceWrapperHandler);
  }



  public runDeviceMethod(id: string, methodName: string, args: any[]) {
    let device: Device = this.deviceService.getDevice(id);
    let deviceHandler: DeviceHandler = this.deviceService.getDeviceHandler(
      device.deviceHandlerId
    );


    //TODO: check that method name is listed as a command
    try {
      this.runEntityMethod(
        deviceHandler.file,
        methodName,
        `deviceHandler_${deviceHandler.id}`,
        this.buildDeviceSandbox(device),
        args
      );
    } catch (err) {
      console.log("err with run device method", err);
    }
  }

  private buildDeviceSandbox(device: Device): any {
    let sandbox: any = {};
    sandbox["log"] = Logger;
    let deviceDelegate: DeviceDelegate = new DeviceDelegate(device, this);
    sandbox["sendEvent"] = deviceDelegate.sendEvent.bind(deviceDelegate);
    sandbox["httpGet"] = deviceDelegate.httpGet;
    sandbox["metadata"] = () => {};
    sandbox["device"] = this.buildDeviceWrapper(device);

    let settingsObject: any = {};
    let settingsHandler = this.buildDeviceSettingsHandler(device);
    const settingsProxy = new Proxy(settingsObject, settingsHandler);
    sandbox["settings"] = settingsProxy;

    return sandbox;
  }

  protected buildDeviceSettingsHandler(device: Device) {
    return {
      settingsCache: {},
      devSettings: device.settings || [],
      get(target: any, prop: any): any {
        let settingLookupVal = this.settingsCache[prop];
        if (typeof settingLookupVal === "undefined") {
          let deviceSetting: DeviceSetting = this.devSettings.find(
            (element: DeviceSetting) => element.name == prop
          );
          if (typeof deviceSetting != "undefined") {
            settingLookupVal = deviceSetting.getValueAsType();
            this.settingsCache[prop] = settingLookupVal;
          }
        }
        return settingLookupVal ? settingLookupVal : null;
      },
    };
  }

  private runEntityMethod(
    file: string,
    methodName: string,
    entityName: string,
    context: any,
    args: any[]
  ): any {
    if (!context) {
      context = {};
    }
    const data = fs.readFileSync(file);

    let methodCall: string;
    if (args != null && args.length > 0) {
      if (args.length == 1) {
        methodCall = `${methodName}(${args[0]})`;
      } else if (args.length == 2) {
        methodCall = `${methodName}(${args[0]}, ${args[1]})`;
      } else if (args.length == 3) {
        methodCall = `${methodName}(${args[0]}, ${args[1]}, ${args[2]})`;
      } else if (args.length == 4) {
        methodCall = `${methodName}(${args[0]}, ${args[1]}, ${args[2]}, ${args[3]})`;
      } else if (args.length == 5) {
        methodCall = `${methodName}(${args[0]}, ${args[1]}, ${args[2]}, ${args[3]}, ${args[4]})`;
      }
    } else {
      methodCall = `${methodName}()`;
    }

    vm.createContext(context);
    vm.runInContext(data.toString() + `\n${methodCall}`, context, {
      filename: `${entityName}.js`,
    });
  }
}
