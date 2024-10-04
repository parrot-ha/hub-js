import { DeviceDelegate } from "../device/device-delegate";
import { EventService } from "../hub/event-service";
import { Subscription } from "./models/subscription";
import { SmartAppDelegate } from "../smartApp/smart-app-delegate";
import { DeviceService } from "../device/device-service";
import { SmartAppService } from "../smartApp/smart-app-service";
import { ParrotEvent } from "./models/event";
import { SmartApp } from "../smartApp/models/smart-app";
import { Device } from "../device/models/device";
import { DeviceHandler } from "../device/models/device-handler";
import { InstalledSmartApp } from "../smartApp/models/installed-smart-app";
import { InstalledSmartAppSetting } from "../smartApp/models/installed-smart-app-setting";
import { DeviceWrapper } from "../device/models/device-wrapper";
import { LocationService } from "../hub/location-service";
import { EntityLogger } from "./entity-logger-service";
import { isEmpty } from "../utils/string-utils";
import { buildDeviceSettingsHandler } from "./entity-service-helper";
import EventEmitter from "node:events";
import { HubAction } from "../device/models/hub-action";
import { ZigBeeUtils } from "../zigbee/zigbee-utils";
import { DataType } from "../utils/data-type";
import { WebServiceResponse } from "./models/web-service-response";
import { WebServiceRequest } from "./models/web-service-request";
import { ScheduleService } from "../hub/schedule-service";
import { ServiceFactory } from "../hub/service-factory";
import { DeviceWrapperList } from "../device/models/device-wrapper-list";
import { ParrotEventWrapper } from "./models/event-wrapper";

const fs = require("fs");
const vm = require("vm");

const logger = require("../hub/logger-service")({
  source: "EntityService",
});

export class EntityService extends EventEmitter {
  private _deviceService: DeviceService;
  private _smartAppService: SmartAppService;
  private _eventService: EventService;
  private _locationService: LocationService;

  constructor(
    deviceService: DeviceService,
    smartAppService: SmartAppService,
    eventService: EventService,
    locationService: LocationService,
  ) {
    super();
    this._deviceService = deviceService;
    this._eventService = eventService;
    this._smartAppService = smartAppService;
    this._locationService = locationService;
  }

  private get scheduleService(): ScheduleService {
    return ServiceFactory.getInstance().getScheduleService();
  }

  sendDeviceEvent(properties: any, device: DeviceWrapper): void {
    logger.silly("send device event!");
    if (!properties) {
      return;
    }

    let event: ParrotEvent = new ParrotEvent(properties, device);
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
    logger.debug("process event!", JSON.stringify(event));
    // skip any events that have a null name
    if (event.name == null) {
      return;
    }

    let subscriptions: Subscription[] =
      this._eventService.getSubscribedSmartApps(event);

    if (
      (subscriptions != null && subscriptions.length > 0) ||
      event.isStateChange()
    ) {
      // save event in database
      this._eventService.saveEvent(event);
      if (event.source == "DEVICE") {
        this._deviceService.updateDeviceState(event);
      }
    }

    // notify any processes that are looking for events.
    this.emit("event", event);

    let promises = [];
    subscriptions.forEach((subscription: Subscription) => {
      //TODO: create a worker pool for these
      try {
        this.runSmartAppMethod(
          subscription.subscribedAppId,
          subscription.handlerMethod,
          [event],
        )
          .then(() => {})
          .catch((err) => logger.warn("Error with runSmartAppMethod ", err));
      } catch (err) {
        logger.warn("Error running smart app method", err);
      }
    });
    if (promises.length > 0) {
      console.log("handle promises");
    }
  }

  public eventsSince(
    source: string,
    sourceId: string,
    date: Date,
    maxEvents: number,
  ): ParrotEventWrapper[] {
    return this._eventService.eventsSince(source, sourceId, date, maxEvents);
  }

  public eventsBetween(
    source: string,
    sourceId: string,
    startDate: Date,
    endDate: Date,
    maxEvents: number,
  ): ParrotEventWrapper[] {
    return this._eventService.eventsBetween(
      source,
      sourceId,
      startDate,
      endDate,
      maxEvents,
    );
  }

  public getSchedule(type: string, id: string): any[] {
    return this.scheduleService.getSchedulesForEntity(type, id);
  }

  public getDeviceHandlerPreferencesLayout(deviceHandlerId: string): any {
    return this._deviceService.getDeviceHandlerPreferencesLayout(
      deviceHandlerId,
    );
  }

  public updateSmartAppSourceCode(id: string, sourceCode: string): boolean {
    if (this._smartAppService.updateSmartAppSourceCode(id, sourceCode)) {
      //TODO: assuming we are caching the scripts, clear out the cache.  Commented out for now.
      //this.clearSmartAppScript(id);
      return true;
    }
    return false;
  }

  public updateDeviceHandlerSourceCode(
    id: string,
    sourceCode: string,
  ): boolean {
    if (this._deviceService.updateDeviceHandlerSourceCode(id, sourceCode)) {
      //TODO: assuming we are caching the scripts, clear out the cache.  Commented out for now.
      //this.clearDeviceHandlerScript(id);
      return true;
    }
    return false;
  }

  public removeSmartApp(id: string): boolean {
    if (this._smartAppService.removeSmartApp(id)) {
      //TODO: assuming we are caching the scripts, clear out the cache.  Commented out for now.
      //this.clearSmartAppScript(id);
      return true;
    }
    return false;
  }

  public removeDeviceHandler(id: string): boolean {
    if (this._deviceService.removeDeviceHandler(id)) {
      //TODO: assuming we are caching the scripts, clear out the cache.  Commented out for now.
      //this.clearDeviceHandlerScript(id);
      return true;
    }
    return false;
  }

  public processSmartAppWebRequest(
    id: string,
    httpMethod: string,
    path: string,
    body: string,
    params: any,
    headers: any,
  ): WebServiceResponse {
    let authenticated: boolean = false;

    if (id == null) {
      // check if we can get the id from the bearer token
      let bearerToken = this.getBearerToken(headers);
      if (bearerToken != null) {
        let installedAutomationAppIds: string[] =
          this._smartAppService.getInstalledSmartAppsByToken(bearerToken);
        if (
          installedAutomationAppIds != null &&
          installedAutomationAppIds.length == 1
        ) {
          id = installedAutomationAppIds[0];
          // set authenticated to true since we know we have a valid bearer token
          authenticated = true;
        }
      }
    }
    let installedSmartApp: InstalledSmartApp =
      this._smartAppService.getInstalledSmartApp(id);

    if (installedSmartApp != null) {
      // check if we have an access token
      if (!authenticated && params != null) {
        let paramAccessToken = params["access_token"];

        let state = installedSmartApp.state;
        if (state != null) {
          let accessToken = state["accessToken"];
          if (accessToken === paramAccessToken) {
            authenticated = true;
          }
        }
      }
      if (!authenticated) {
        // check for bearer token
        let bearerToken = this.getBearerToken(headers);
        if (bearerToken != null) {
          // check bearer token is valid
          let installedAutomationAppIds: string[] =
            this._smartAppService.getInstalledSmartAppsByToken(bearerToken);
          if (
            installedAutomationAppIds != null &&
            installedAutomationAppIds.includes(id)
          ) {
            authenticated = true;
          }
        }
      }

      if (!authenticated) {
        return new WebServiceResponse({
          status: 401,
          contentType: "application/xhtml+xml",
          data: "<oauth><error_description>Invalid or missing access token</error_description><error>invalid_token</error></oauth>",
        });
      }

      let mappings = this.getInstalledSmartAppMapping(id, params);
      if (mappings != null) {
        for (let key of Object.keys(mappings)) {
          if (path.toLowerCase() === key.toLowerCase()) {
            // we have a match
            if (mappings[key] != null) {
              let methodName: string = mappings[key][httpMethod];
              try {
                let response = this.runSmartAppMethodWithReturn(
                  id,
                  methodName,
                  {
                    params: params,
                    request: new WebServiceRequest(httpMethod, headers, body),
                  },
                  null,
                );

                if (response instanceof WebServiceResponse) {
                  return response;
                } else if (typeof response === "object") {
                  return new WebServiceResponse({
                    data: JSON.stringify(response),
                  });
                }
              } catch (err) {
                logger.warn("error", err.message);
              }
            }
          }
        }
      }
    }

    return new WebServiceResponse({ status: 404 });
  }

  private getInstalledSmartAppMapping(id: string, params: any): any {
    let installedSmartApp: InstalledSmartApp =
      this._smartAppService.getInstalledSmartApp(id);
    let smartApp: SmartApp = this._smartAppService.getSmartApp(
      installedSmartApp.smartAppId,
    );
    let retVal;
    let context = this.buildSmartAppSandbox(installedSmartApp, true);
    context["params"] = params;

    const data = fs.readFileSync(smartApp.file);

    vm.createContext(context);
    vm.runInContext(data.toString(), context, {
      filename: `smartApp_${smartApp.id}.js`,
    });
    if (context.getPathMappings() != null) {
      return context.getPathMappings();
    }
    return null;
  }

  private getBearerToken(headers: any): string {
    let bearerToken = null;
    let authorizationHeader = headers["Authorization"];
    if (authorizationHeader != null) {
      if (authorizationHeader.startsWith("Bearer ")) {
        bearerToken = authorizationHeader.substring("Bearer ".length);
        if (bearerToken.includes(".")) {
          let bearerTokenArray = bearerToken.split(".");
          bearerToken = bearerTokenArray[bearerTokenArray.length - 1];
        }
      }
    }
    return bearerToken;
  }

  public deleteInstalledSmartApp(id: string): boolean {
    let status = this._smartAppService.deleteInstalledSmartApp(id);
    if (status) {
      this._eventService.deleteSubscriptionsForInstalledSmartApp(id);
    }
    return status;
  }

  public async runSmartAppMethod(
    id: string,
    methodName: string,
    args: any[],
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        let retVal = this.runSmartAppMethodWithReturn(
          id,
          methodName,
          null,
          args,
        );
        resolve(retVal);
      } catch (error) {
        reject(error);
      }
    });
  }

  private runSmartAppMethodWithReturn(
    id: string,
    methodName: string,
    additionalContext: any,
    args: any[],
  ): any {
    let installedSmartApp: InstalledSmartApp =
      this._smartAppService.getInstalledSmartApp(id);
    let smartApp: SmartApp = this._smartAppService.getSmartApp(
      installedSmartApp.smartAppId,
    );
    let retVal;
    let stateCopy = JSON.parse(JSON.stringify(installedSmartApp.state));
    let context = this.buildSmartAppSandbox(installedSmartApp);
    if (additionalContext != null && typeof additionalContext === "object") {
      for (const key in additionalContext) {
        context[key] = additionalContext[key];
      }
    }

    logger.debug("stateCopy", JSON.stringify(stateCopy));

    const data = fs.readFileSync(smartApp.file);

    //TODO: can this context be saved and reused?
    vm.createContext(context);
    vm.runInContext(data.toString(), context, {
      filename: `smartApp_${smartApp.id}.js`,
    });
    if (typeof context[methodName] === "function") {
      let myFunction: Function = context[methodName];

      if (Array.isArray(args)) {
        retVal = myFunction.call(null, ...args);
      } else {
        retVal = myFunction.call(null, args);
      }
      //update state
      this._smartAppService.updateInstalledSmartAppState(
        installedSmartApp.id,
        stateCopy,
        context.state,
      );
    } else {
      //throw error if function not found
      throw new Error(`Function ${methodName} not found`);
    }

    return retVal;
  }

  public updateOrInstallInstalledSmartApp(id: string): void {
    let installedSmartApp: InstalledSmartApp =
      this._smartAppService.getInstalledSmartApp(id);
    if (installedSmartApp.installed) {
      this.runSmartAppMethod(id, "updated", null).catch((err) => {
        //TODO: log this to the live log
        logger.warn("error! updated", err);
      });
    } else {
      installedSmartApp.installed = true;
      this._smartAppService.updateInstalledSmartApp(installedSmartApp);
      this.runSmartAppMethod(id, "installed", null).catch((err) => {
        //TODO: log this to the live log
        logger.warn("error! installed", err);
      });
    }
  }

  public getInstalledSmartAppConfigurationPage(
    id: string,
    pageName: string,
  ): any {
    try {
      let preferences: any =
        this._smartAppService.getSmartAppPreferencesByInstalledSmartApp(id);

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
            (page) => pageName === page.name,
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
      logger.warn(err);
    }
    return null;
  }

  private getDynamicPage(id: string, page: any): any {
    let content: string = page.content.toString();
    // this is a dynamic page, run method to get content
    let dynamicPageResponse: any = this.runSmartAppMethodWithReturn(
      id,
      content,
      null,
      null,
    );

    if (dynamicPageResponse) {
      dynamicPageResponse.content = content;
      if (isEmpty(dynamicPageResponse.title) && !isEmpty(page.title)) {
        dynamicPageResponse.title = page.title;
      }
    }
    return dynamicPageResponse;
  }

  private buildSmartAppSandbox(
    installedSmartApp: InstalledSmartApp,
    includeMappings: boolean = false,
  ): any {
    let sandbox: any = {};
    sandbox["log"] = new EntityLogger(
      "SMARTAPP",
      installedSmartApp.id,
      installedSmartApp.displayName,
    );

    let smartAppDelegate: SmartAppDelegate = new SmartAppDelegate(
      installedSmartApp,
      this._eventService,
      this._locationService,
      this._smartAppService,
      this.scheduleService,
      false,
      false,
      includeMappings,
    );
    sandbox.state = smartAppDelegate.state;
    if (includeMappings) {
      sandbox["getPathMappings"] = (smartAppDelegate as any)[
        "getPathMappings"
      ].bind(smartAppDelegate);
    }

    smartAppDelegate.sandboxMethods.forEach((sandboxMethod: string) => {
      sandbox[sandboxMethod] = (smartAppDelegate as any)[sandboxMethod].bind(
        smartAppDelegate,
      );
    });

    let settingsObject: any = {};
    let settingsHandler = this.buildSmartAppSettingsHandler(installedSmartApp);
    const settingsProxy = new Proxy(settingsObject, settingsHandler);
    sandbox["settings"] = settingsProxy;
    //TODO: use a wrapper
    sandbox["app"] = installedSmartApp;

    //TODO: use location wrapper
    sandbox["location"] = this._locationService.getLocation();

    return sandbox;
  }

  protected buildSmartAppSettingsHandler(installedSmartApp: InstalledSmartApp) {
    return {
      settingsCache: {},
      isaSettings: installedSmartApp.settings ? installedSmartApp.settings : [],
      shDeviceService: this._deviceService,
      shEntityService: this,
      get(target: any, prop: any): any {
        let settingLookupVal = this.settingsCache[prop];
        if (typeof settingLookupVal === "undefined") {
          let installedSmartAppSetting: InstalledSmartAppSetting =
            this.isaSettings.find(
              (element: InstalledSmartAppSetting) => element.name == prop,
            );
          if (typeof installedSmartAppSetting != "undefined") {
            if (installedSmartAppSetting.type.startsWith("capability")) {
              if (installedSmartAppSetting.value) {
                if (installedSmartAppSetting.multiple) {
                  settingLookupVal =
                    this.shEntityService.buildDeviceWrapperList(
                      JSON.parse(installedSmartAppSetting.value),
                      this.shDeviceService,
                    );
                } else {
                  let deviceId = installedSmartAppSetting.value;
                  settingLookupVal = this.shEntityService.buildDeviceWrapper(
                    this.shDeviceService.getDevice(deviceId),
                    this.shDeviceService,
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
    let deviceWrapper = new DeviceWrapper(device, this._deviceService);
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

  protected buildDeviceWrapperList(deviceIds: string[]) {
    let deviceWrappers: DeviceWrapper[] = [];
    deviceIds.forEach((devId) =>
      deviceWrappers.push(
        this.buildDeviceWrapper(this._deviceService.getDevice(devId)),
      ),
    );
    let deviceWrapperList = new DeviceWrapperList(deviceWrappers);
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
            if (dwTarget.devices != null) {
              dwTarget.devices.forEach((dw: DeviceWrapper) =>
                this.shEntityService.runDeviceMethod(dw.id, dwProp, args),
              );
            }
          }.bind(this);
        }
      },
    };
    return new Proxy(deviceWrapperList, deviceWrapperHandler);
  }

  public runDeviceMethodByDNI(
    integrationId: string,
    deviceNetworkId: string,
    methodName: string,
    args: any[],
  ) {
    let device: Device = this._deviceService.getDeviceByIntegrationAndDNI(
      integrationId,
      deviceNetworkId,
    );
    if (device != null) {
      this.runDeviceMethod(device.id, methodName, args);
    } else {
      logger.warn(
        `Cannot find device ${deviceNetworkId} with integration id ${integrationId}.`,
      );
    }
  }

  public runDeviceMethod(id: string, methodName: string, args: any[]) {
    let device: Device = this._deviceService.getDevice(id);
    let deviceHandler: DeviceHandler = this._deviceService.getDeviceHandler(
      device.deviceHandlerId,
    );
    //TODO: check that method name is listed as a command
    try {
      let stateCopy = JSON.parse(JSON.stringify(device.state));
      let context = this.buildDeviceSandbox(device, deviceHandler);
      let returnVal = this.runEntityMethod(
        deviceHandler.file,
        methodName,
        `deviceHandler_${deviceHandler.id}`,
        context,
        args,
      );
      this._deviceService.processReturnObj(device, returnVal);
      //update state
      this._deviceService.saveDeviceState(device.id, stateCopy, context.state);
    } catch (err) {
      logger.warn("err with run device method", err);
    }
  }

  private buildDeviceSandbox(
    device: Device,
    deviceHandler: DeviceHandler,
  ): any {
    let sandbox: any = {};
    sandbox["log"] = new EntityLogger("Device", device.id, device.displayName);
    let deviceDelegate: DeviceDelegate = new DeviceDelegate(
      device,
      this,
      this._deviceService,
      this.scheduleService,
    );

    sandbox["HubAction"] = HubAction;
    sandbox.state = JSON.parse(JSON.stringify(device.state));
    deviceDelegate.sandboxMethods.forEach((sandboxMethod: string) => {
      sandbox[sandboxMethod] = (deviceDelegate as any)[sandboxMethod].bind(
        deviceDelegate,
      );
    });

    sandbox["metadata"] = () => {};
    sandbox["device"] = this.buildDeviceWrapper(device);
    sandbox["zigbee"] = new ZigBeeUtils(
      new DeviceWrapper(device, this._deviceService),
    );

    if (deviceHandler.includes != null) {
      deviceHandler.includes.forEach((include) => {
        if (include === "zigbee.zcl.DataType") {
          sandbox["DataType"] = DataType;
        }
        //TODO: handle async http
      });
    }

    let settingsObject: any = {};
    let settingsHandler = buildDeviceSettingsHandler(device);
    const settingsProxy = new Proxy(settingsObject, settingsHandler);
    sandbox["settings"] = settingsProxy;

    return sandbox;
  }

  private runEntityMethod(
    file: string,
    methodName: string,
    entityName: string,
    context: any,
    args: any[],
  ): any {
    if (!context) {
      context = {};
    }
    const data = fs.readFileSync(file);

    //TODO: can this context be saved and reused?
    vm.createContext(context, { microtaskMode: "afterEvaluate" });
    try {
      vm.runInContext(data.toString(), context, {
        filename: `${entityName}.js`,
        microtaskMode: "afterEvaluate",
        timeout: 20000, // timeout after 20 seconds
      });
    } catch (err) {
      logger.warn("err with run entity method", err);
    }
    if (typeof context[methodName] === "function") {
      let myFunction: Function = context[methodName];
      try {
        let retVal;
        if (Array.isArray(args)) {
          retVal = myFunction.call(null, ...args);
        } else {
          retVal = myFunction.call(null, args);
        }
        return retVal;
      } catch (err) {
        logger.warn("Error with run entity method, context method", err);
      }
    } else {
      //TODO: do something about missing methods
      logger.warn(`method ${methodName} missing on entity ${entityName}`);
    }
  }

  public getDeviceHandlerByFingerprint(deviceInfo: Map<string, string>): {
    id: string;
    joinName: string;
  } {
    return this._deviceService.getDeviceHandlerByFingerprint(deviceInfo);
  }
}
