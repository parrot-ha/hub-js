import { DeviceDelegate } from "../device/device-delegate";
import { EventService } from "../hub/event-service";
import { Subscription } from "./models/subscription";
import { SmartAppDelegate } from "../smartApp/smart-app-delegate";
import { DeviceService } from "../device/device-service";
import { SmartAppService } from "../smartApp/smart-app-service";
import { ParrotEvent } from "./models/event";
import { SmartApp, SmartAppType } from "../smartApp/models/smart-app";
import { Device } from "../device/models/device";
import { DeviceHandler } from "../device/models/device-handler";
import { InstalledSmartApp } from "../smartApp/models/installed-smart-app";
import { InstalledSmartAppSetting } from "../smartApp/models/installed-smart-app-setting";
import { DeviceWrapper } from "../device/models/device-wrapper";
import { DeviceSetting } from "../device/models/device-setting";
import { LocationService } from "../hub/location-service";
import { EntityLogger } from "./entity-logger-service";
import { isEmpty } from "../utils/string-utils";
import EventEmitter from "node:events";

const fs = require("fs");
const vm = require("vm");

export class EntityService extends EventEmitter {
  private deviceService: DeviceService;
  private smartAppService: SmartAppService;
  private eventService: EventService;
  private _locationService: LocationService;

  constructor(
    deviceService: DeviceService,
    smartAppService: SmartAppService,
    eventService: EventService,
    locationService: LocationService
  ) {
    super();
    this.deviceService = deviceService;
    this.eventService = eventService;
    this.smartAppService = smartAppService;
    this._locationService = locationService;
  }

  sendDeviceEvent(properties: any, deviceId: string): void {
    console.log("send device event!");
    if (!properties) {
      return;
    }

    let event: ParrotEvent = new ParrotEvent(properties);
    event.source = "DEVICE";
    event.sourceId = deviceId;
    this.processEvent(event);
  }

  public sendHubEvent(properties: any): void {
    if (properties == null) {
      return;
    }
    let event: ParrotEvent = new ParrotEvent(properties);
    event.source = "HUB";
    event.sourceId = this._locationService.getHub().id;

    this.processEvent(event);
  }

  private processEvent(event: ParrotEvent): void {
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

    // notify any processes that are looking for events.
    this.emit("event", event);

    subscriptions.forEach((subscription: Subscription) => {
      //TODO: create a worker pool for these
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

  public updateSmartAppSourceCode(id: string, sourceCode: string): boolean {
    if (this.smartAppService.updateSmartAppSourceCode(id, sourceCode)) {
      //TODO: assuming we are caching the scripts, clear out the cache.  Commented out for now.
      //this.clearSmartAppScript(id);
      return true;
    }
    return false;
  }

  public removeSmartApp(id: string): boolean {
    if (this.smartAppService.removeSmartApp(id)) {
      //TODO: assuming we are caching the scripts, clear out the cache.  Commented out for now.
      //this.clearSmartAppScript(id);
      return true;
    }
    return false;
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
        let retVal;
        let stateCopy = JSON.parse(JSON.stringify(installedSmartApp.state));
        let context = this.buildSmartAppSandbox(installedSmartApp);

        console.log("stateCopy", JSON.stringify(stateCopy));

        const data = fs.readFileSync(smartApp.file);

        //TODO: can this context be saved and reused?
        vm.createContext(context);
        vm.runInContext(data.toString(), context, {
          filename: `smartApp_${smartApp.id}.js`,
        });
        if (typeof context[methodName] === "function") {
          let myFunction: Function = context[methodName];
          try {
            if (Array.isArray(args)) {
              retVal = myFunction.call(null, ...args);
            } else {
              retVal = myFunction.call(null, args);
            }
            //update state
            this.smartAppService.updateInstalledSmartAppState(
              installedSmartApp.id,
              stateCopy,
              context.state
            );
          } catch (err) {
            console.log(err);
          }
        }

        resolve(retVal);
      } catch (error) {
        reject(error);
      }
    });
  }

  public updateOrInstallInstalledSmartApp(id: string): void {
    let installedSmartApp: InstalledSmartApp =
      this.smartAppService.getInstalledSmartApp(id);
    if (installedSmartApp.installed) {
      this.runSmartAppMethod(id, "updated", null);
    } else {
      installedSmartApp.installed = true;
      this.smartAppService.updateInstalledSmartApp(installedSmartApp);
      this.runSmartAppMethod(id, "installed", null);
    }
  }

  public getInstalledSmartAppConfigurationPage(
    id: string,
    pageName: string
  ): any {
    try {
      let preferences: any =
        this.smartAppService.getSmartAppPreferencesByInstalledSmartApp(id);

      if (preferences.pageList != null) {
        // multiple pages
        if (pageName == null) {
          // get first page
          let firstPage: any = preferences.pageList[0];
          if (firstPage.content) {
            // this is a dynamic page, run method to get content
            return this.getDynamicPage(id, firstPage);
          } else {
            return firstPage;
          }
        } else {
          let page = (preferences.pageList as Array<any>).find(
            (page) => pageName === page.name
          );
          if (page) {
            if (page.content) {
              // this is a dynamic page, run method to get content
              return this.getDynamicPage(id, page);
            } else {
              return page;
            }
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
    return null;
  }

  private getDynamicPage(id: string, page: any): any {
    let content: string = page.content.toString();
    // this is a dynamic page, run method to get content
    let dynamicPageResponse: any = this.runSmartAppMethod(id, content, null);

    if (dynamicPageResponse) {
      dynamicPageResponse.content = content;
      if (isEmpty(dynamicPageResponse.title) && !isEmpty(page.title)) {
        dynamicPageResponse.title = page.title;
      }
    }
    return dynamicPageResponse;
  }

  private buildSmartAppSandbox(installedSmartApp: InstalledSmartApp): any {
    let sandbox: any = {};
    sandbox["log"] = new EntityLogger(
      "SMARTAPP",
      installedSmartApp.id,
      installedSmartApp.displayName
    );
    sandbox.state = JSON.parse(JSON.stringify(installedSmartApp.state));
    let smartAppDelegate: SmartAppDelegate = new SmartAppDelegate(
      installedSmartApp,
      this.eventService,
      this._locationService
    );

    smartAppDelegate.sandboxMethods.forEach((sandboxMethod: string) => {
      sandbox[sandboxMethod] = (smartAppDelegate as any)[sandboxMethod].bind(
        smartAppDelegate
      );
    });

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
        //TODO: is there a better way to handle this?
        if (dwProp === "_device" || dwProp === "_deviceService") {
          return dwTarget[dwProp];
        }
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

  public runDeviceMethodByDNI(
    integrationId: string,
    deviceNetworkId: string,
    methodName: string,
    args: any[]
  ) {
    let device: Device = this.deviceService.getDeviceByIntegrationAndDNI(
      integrationId,
      deviceNetworkId
    );
    if (device != null) {
      this.runDeviceMethod(device.id, methodName, args);
    }
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
    sandbox["log"] = new EntityLogger("Device", device.id, device.displayName);
    let deviceDelegate: DeviceDelegate = new DeviceDelegate(device, this);

    // sandbox["sendEvent"] = deviceDelegate.sendEvent.bind(deviceDelegate);
    // sandbox["httpGet"] = deviceDelegate.httpGet;
    deviceDelegate.sandboxMethods.forEach((sandboxMethod: string) => {
      sandbox[sandboxMethod] = (deviceDelegate as any)[sandboxMethod].bind(
        deviceDelegate
      );
    });

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

    //TODO: can this context be saved and reused?
    vm.createContext(context, {microtaskMode: "afterEvaluate"});
    try {
      vm.runInContext(data.toString(), context, {
        filename: `${entityName}.js`,
        microtaskMode: "afterEvaluate",
        timeout: 20000, // timeout after 20 seconds
      });
    } catch (err) {
      console.log("err with run entity method", err);
    }
    if (typeof context[methodName] === "function") {
      let myFunction: Function = context[methodName];
      try {
        if (Array.isArray(args)) {
          myFunction.call(null, ...args);
        } else {
          myFunction.call(null, args);
        }
      } catch (err) {
        console.log(err);
      }
    } else {
      //TODO: do something about missing methods
      console.log(`method ${methodName} missing on entity ${entityName}`);
    }
  }
}
