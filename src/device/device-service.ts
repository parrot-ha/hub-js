import * as crypto from "crypto";
import { DeviceHandler, DeviceHandlerType } from "./models/device-handler";
import { Device } from "./models/device";
import { ParrotEvent } from "../entity/models/event";
import { DeviceMetadataDelegate } from "./device-metadata-delegate";
import { DeviceDataStore } from "./device-data-store";
import { DeviceSetting } from "./models/device-setting";
import { State } from "./models/state";
import { Attribute } from "./models/attribute";
import { Capability } from "./models/capability";
import { Capabilities } from "./models/capabilities";
import { EntityLogger } from "../entity/entity-logger-service";
import { isBlank, isNotBlank } from "../utils/string-utils";
import { DeviceHandlerInUseError } from "./errors/device-handler-in-use-error";
import { HubAction } from "./models/hub-action";
import { HubMultiAction } from "./models/hub-multi-action";
import { Protocol } from "./models/protocol";
import { HubResponse } from "./models/hub-response";
import { IntegrationRegistry } from "../integration/integration-registry";
import { difference } from "../utils/object-utils";
import { Fingerprint } from "./models/fingerprint";

const logger = require("../hub/logger-service")({ source: "DeviceService" });

const fs = require("fs");
const vm = require("vm");

export class DeviceService {
  public static PARENT_TYPE_SMART_APP: string = "ISA";
  public static PARENT_TYPE_DEVICE: string = "DEV";

  private _deviceDataStore: DeviceDataStore;
  private _integrationRegistry: IntegrationRegistry;

  public constructor(
    deviceDataStore: DeviceDataStore,
    integrationRegistry: IntegrationRegistry
  ) {
    this._deviceDataStore = deviceDataStore;
    this._integrationRegistry = integrationRegistry;
  }

  public getDeviceHandlers(): DeviceHandler[] {
    return this._deviceDataStore.getDeviceHandlers();
  }

  public getDevices(): Device[] {
    return this._deviceDataStore.getDevices();
  }

  public getDevice(id: string): Device {
    return this._deviceDataStore.getDevice(id);
  }

  public getDeviceByIntegrationAndDNI(
    integrationId: string,
    deviceNetworkId: string
  ): Device {
    return this._deviceDataStore.getDeviceByIntegrationAndDNI(
      integrationId,
      deviceNetworkId
    );
  }

  public getChildDevicesForDevice(parentDeviceId: string): Device[] {
    return this._deviceDataStore.getDeviceChildDevices(parentDeviceId);
  }

  public addChildDevice(
    parentId: string,
    parentType: string,
    namespace: string,
    typeName: string,
    deviceNetworkId: string,
    properties: any
  ): Device {
    if (isBlank(deviceNetworkId)) {
      throw new Error("IllegalArgument: Device Network ID not specified.");
    }

    let deviceHandler: DeviceHandler;
    if (isBlank(namespace)) {
      deviceHandler = this._deviceDataStore.getDeviceHandlerByName(typeName);
    } else {
      deviceHandler = this._deviceDataStore.getDeviceHandlerByNamespaceAndName(
        namespace,
        typeName
      );
    }

    if (deviceHandler == null) {
      throw new Error(
        "UnknownDeviceType: Unable to find device type for namespace: " +
          namespace +
          " and name: " +
          typeName
      );
    }

    let device: Device = new Device();
    device.deviceHandlerId = deviceHandler.id;
    device.name = deviceHandler.name;
    if (properties != null) {
      if (properties.label != null) {
        device.label = properties.label.toString();
      }
      if (properties.name != null) {
        device.name = properties.name.toString();
      }
      if (properties.data != null && properties.data instanceof Object) {
        device.data = properties.data;
      }
    }
    device.deviceNetworkId = deviceNetworkId;
    if (parentType === DeviceService.PARENT_TYPE_SMART_APP) {
      device.parentInstalledSmartAppId = parentId;
    } else if (parentType === DeviceService.PARENT_TYPE_DEVICE) {
      device.parentDeviceId = parentId;
    }

    let deviceId: string = this._deviceDataStore.createDevice(device);

    return this._deviceDataStore.getDevice(deviceId);
  }

  public deviceExists(
    integrationId: string,
    deviceNetworkId: string,
    additionalIntegrationParameters: any = null
  ): boolean {
    if (additionalIntegrationParameters != null) {
      if (deviceNetworkId != null) {
        let device: Device = this.getDeviceByIntegrationAndDNI(
          integrationId,
          deviceNetworkId
        );
        if (device != null) {
          // check additional integration options
          return this.deviceMatchesIntegrationParameters(
            device,
            additionalIntegrationParameters
          );
        }
      } else {
        for (let device of this.getDevices()) {
          if (
            device.integration?.id === integrationId &&
            this.deviceMatchesIntegrationParameters(
              device,
              additionalIntegrationParameters
            )
          ) {
            return true;
          }
        }
      }
      return false;
    } else {
      return (
        this.getDeviceByIntegrationAndDNI(integrationId, deviceNetworkId) !=
        null
      );
    }
  }

  protected deviceMatchesIntegrationParameters(
    device: Device,
    additionalIntegrationParameters: any
  ): boolean {
    if (device != null && device.integration != null) {
      //check additional integration options
      if (additionalIntegrationParameters != null) {
        for (let key of Object.keys(additionalIntegrationParameters)) {
          let option: any = additionalIntegrationParameters.get(key);
          if (option == null && device.integration.options[key] != null) {
            return false;
          }
          if (option != null && option !== device.integration.options[key]) {
            return false;
          }
        }
      }
      return true;
    }
    return false;
  }

  public getDeviceHandler(id: string) {
    return this._deviceDataStore.getDeviceHandler(id);
  }

  public getDevicesByCapability(capability: string): Device[] {
    return this._deviceDataStore.getDevicesByCapability(capability);
  }

  public getDevicesByDeviceHandler(deviceHandlerId: string): Device[] {
    return this._deviceDataStore.getDevicesByDeviceHandler(deviceHandlerId);
  }

  public addDevice(device: Device) {
    if (device.name == null) {
      device.name = this._deviceDataStore.getDeviceHandler(
        device.deviceHandlerId
      ).name;
    }
    return this._deviceDataStore.createDevice(device);
  }

  public updateDevice(id: string, deviceMap: any, settingsMap: any): boolean {
    let device: Device = this.getDevice(id);

    if ("name" in deviceMap) {
      device.name = deviceMap.name;
    }
    if ("label" in deviceMap) {
      device.label = deviceMap.label;
    }
    if ("deviceHandlerId" in deviceMap) {
      device.deviceHandlerId = deviceMap.deviceHandlerId;
    }
    if ("deviceNetworkId" in deviceMap) {
      device.deviceNetworkId = deviceMap.deviceNetworkId;
    }
    if ("integrationId" in deviceMap) {
      let integrationId: string = deviceMap.integrationId;
      if (integrationId?.trim()?.length > 0) {
        device.integration.id = integrationId;
      } else {
        // we are clearing the integration
        device.integration = null;
      }
    }

    for (let key of Object.keys(settingsMap)) {
      let setting: any = settingsMap[key];
      let deviceSetting: DeviceSetting = device.getSettingByName(key);
      if (deviceSetting != null) {
        // update existing setting
        deviceSetting.processValueTypeAndMultiple(
          setting.value,
          setting.type,
          setting.multiple
        );
      } else {
        // create new setting
        deviceSetting = new DeviceSetting(key, null, null, null);
        deviceSetting.processValueTypeAndMultiple(
          setting.value,
          setting.type,
          setting.multiple
        );
        device.addSetting(deviceSetting);
      }
    }
    this._deviceDataStore.updateDevice(device);
    return true;
  }

  public removeDeviceAsync(id: string, force: boolean): Promise<boolean> {
    let device = this.getDevice(id);
    if(device == null) {
      // device doesn't exist, just return true.
      return new Promise((resolve) => resolve(true));
    }
    let integrationId = device.integration?.id;
    let deviceNetworkId = device.deviceNetworkId;

    return new Promise((resolve) => {
      if (integrationId != null) {
        //call integration to remove device
        let integrationPromise = this._integrationRegistry.removeDeviceAsync(
          integrationId,
          deviceNetworkId,
          force
        );
        if (integrationPromise != null) {
          integrationPromise.then((result) => {
            if (result) {
              resolve(this._deviceDataStore.deleteDevice(id));
            } else {
              resolve(false);
            }
          });
        }
      } else {
        // no integration, just delete from data store.
        resolve(this._deviceDataStore.deleteDevice(id));
      }
    });
  }

  public saveDevice(device: Device): void {
    this._deviceDataStore.updateDevice(device);
  }

  public initialize(): void {
    this.reprocessDeviceHandlers();
    //TODO: handle extensions
    // if (extensionService != null) {
    //     extensionService.registerStateListener(this);
    // }
  }

  public shutdown(): Promise<any> {
    logger.info("shutting down device service");
    //TODO: handle extensions
    // if (extensionService != null) {
    //     extensionService.unregisterStateListener(this);
    // }
    return new Promise((resolve) => {
      resolve(true);
    });
  }

  public reprocessDeviceHandlers(): void {
    //TODO: run this process in the background, allows quicker start up of system at the
    // expense of system starting up with possibly old device handler definition, however
    // this should be quickly rectified once system is fully running

    let deviceHandlers: DeviceHandler[] =
      this._deviceDataStore.getDeviceHandlers();
    let newDeviceHandlerInfoMap: Map<string, DeviceHandler> =
      this.processDeviceHandlerInfo();

    if (deviceHandlers != null && newDeviceHandlerInfoMap != null) {
      // check each device handler info against what is in the config file.
      this.compareNewAndExistingDeviceHandlers(
        deviceHandlers,
        Array.from(newDeviceHandlerInfoMap.values())
      );
    }
  }

  private compareNewAndExistingDeviceHandlers(
    existingDeviceHandlers: DeviceHandler[],
    newDeviceHandlers: DeviceHandler[]
  ): void {
    // check each device handler info against what is in the config file.
    for (let newDHInfo of newDeviceHandlers) {
      let fileName: string = newDHInfo.file;

      let foundExistingDH: boolean = false;
      for (let oldDHInfo of existingDeviceHandlers) {
        if (fileName === oldDHInfo.file) {
          foundExistingDH = true;
          // the file name matches, let see if any of the values have changed.
          //TODO: this check is only if the file name stays the same, add another check in case all the contents stay the same, but the file name changed.
          if (newDHInfo.equalsIgnoreId(oldDHInfo)) {
            // only difference is the id,, so no changes
            //logger.debug("No changes for file " + fileName);
          } else {
            logger.debug("cnaedh Changes for file " + fileName);
            newDHInfo.id = oldDHInfo.id;
            this._deviceDataStore.updateDeviceHandler(newDHInfo);
          }
        }
      }
      if (!foundExistingDH) {
        // we have a new device handler.
        this._deviceDataStore.createDeviceHandler(newDHInfo);
      }
    }
  }

  private processDeviceHandlerInfo(): Map<string, DeviceHandler> {
    // we need to process device handlers
    let deviceHandlerInfo: Map<string, DeviceHandler> = new Map<
      string,
      DeviceHandler
    >();

    // load built in device handlers
    const dhDirFiles: string[] = fs.readdirSync("deviceHandlers/");
    dhDirFiles.forEach((dhDirFile) => {
      if (dhDirFile.endsWith(".js")) {
        let fileName = `deviceHandlers/${dhDirFile}`;
        try {
          const sourceCode = fs.readFileSync(fileName)?.toString();
          let deviceHandler = this.processDeviceHandlerSource(
            fileName,
            sourceCode,
            DeviceHandlerType.SYSTEM
          );
          deviceHandlerInfo.set(deviceHandler.id, deviceHandler);
        } catch (err) {
          logger.warn("error processing system device handler files", err);
        }
      }
    });

    // load device handlers from data store
    let dhSources: Map<string, string> =
      this._deviceDataStore.getDeviceHandlerSources();
    dhSources?.forEach((sourceCode: string, fileName: string) => {
      let deviceHandler = this.processDeviceHandlerSource(
        fileName,
        sourceCode,
        DeviceHandlerType.USER
      );
      deviceHandlerInfo.set(deviceHandler.id, deviceHandler);
    });

    // TODO: load device handler sources from extensions

    return deviceHandlerInfo;
  }

  // state of attribute
  updateDeviceState(event: ParrotEvent): void {
    let d: Device = this._deviceDataStore.getDevice(event.sourceId);
    let s: State = new State(event.name, event.value, event.unit);
    d.setCurrentState(s);
    //TODO: store state history in database
    //TODO: use write behind cache for saving device
    this._deviceDataStore.updateDevice(d);
  }

  // state object
  public saveDeviceState(id: string, originalState: any, updatedState: any) {
    let changes = difference(updatedState, originalState);
    let device: Device = this.getDevice(id);
    let existingState = device.state;
    if (existingState) {
      changes.removed.forEach((key) => delete existingState[key]);
      Object.keys(changes.updated).forEach(
        (key) => (existingState[key] = changes.updated[key])
      );
      Object.keys(changes.added).forEach(
        (key) => (existingState[key] = changes.added[key])
      );
      this._deviceDataStore.saveDeviceState(id, existingState);
    } else {
      this._deviceDataStore.saveDeviceState(id, updatedState);
    }
  }

  public getDeviceHandlerByNameAndNamespace(
    name: string,
    namespace: string
  ): DeviceHandler {
    for (let deviceHandler of this.getDeviceHandlers()) {
      if (
        deviceHandler.name != null &&
        deviceHandler.name === name &&
        deviceHandler.namespace != null &&
        deviceHandler.namespace === namespace
      ) {
        return deviceHandler;
      }
    }
    return null;
  }

  public getDeviceHandlerPreferencesLayout(deviceHandlerId: string): any {
    let deviceHandler: DeviceHandler = this.getDeviceHandler(deviceHandlerId);
    if (deviceHandler) {
      const data = fs.readFileSync(deviceHandler.file);
      const testCodeMetadata = data.toString();
      let deviceMetadataDelegate: DeviceMetadataDelegate =
        new DeviceMetadataDelegate(false, true);
      let sandbox = this.buildMetadataSandbox(deviceMetadataDelegate);
      vm.createContext(sandbox);
      vm.runInContext(testCodeMetadata, sandbox, {
        filename: deviceHandler.file,
      });
      return deviceMetadataDelegate.metadataValue?.preferences;
    } else {
      return null;
    }
  }

  public getAttributeForDeviceHandler(
    deviceHandlerId: string,
    attributeName: string
  ): Attribute {
    let deviceHandler: DeviceHandler = this.getDeviceHandler(deviceHandlerId);
    if (deviceHandler == null) {
      return null;
    }

    let foundAttribute: Attribute;

    attributeName = attributeName.toLowerCase();
    if (deviceHandler.attributeList != null) {
      foundAttribute = deviceHandler.attributeList.find(
        (attrib) => attrib.name.toLowerCase() === attributeName
      );
    }
    if (foundAttribute) {
      return foundAttribute;
    }

    if (deviceHandler.capabilityList != null) {
      deviceHandler.capabilityList.forEach((capabilityName: string) => {
        let capability: Capability = Capabilities.getCapability(capabilityName);
        if (capability != null) {
          if (capability.attributes != null) {
            foundAttribute = capability.attributes.find(
              (attrib) => attrib.name.toLowerCase() === attributeName
            );
          }
        }
      });
    }
    if (foundAttribute) {
      return foundAttribute;
    } else {
      return null;
    }
  }

  public removeDeviceHandler(id: string): boolean {
    let devicesInUse: Device[] = this.getDevicesByDeviceHandler(id);
    if (devicesInUse?.length > 0) {
      throw new DeviceHandlerInUseError("Device Handler in use", devicesInUse);
    } else {
      return this._deviceDataStore.deleteDeviceHandler(id);
    }
  }

  public getDeviceHandlerSourceCode(id: string): string {
    return this._deviceDataStore.getDeviceHandlerSourceCode(id);
  }

  public addDeviceHandlerSourceCode(sourceCode: string): string {
    let deviceHandler = this.processDeviceHandlerSource(
      "newDeviceHandler",
      sourceCode,
      DeviceHandlerType.USER
    );
    if (deviceHandler == null) {
      throw new Error("No definition found.");
    }
    let dhId: string = this._deviceDataStore.createDeviceHandlerSourceCode(
      sourceCode,
      deviceHandler
    );
    return dhId;
  }

  public updateDeviceHandlerSourceCode(
    id: string,
    sourceCode: string
  ): boolean {
    let existingDeviceHandler: DeviceHandler = this.getDeviceHandler(id);
    if (existingDeviceHandler) {
      // compile source code so that any compile errors get thrown and we get any new definition changes
      let updatedDeviceHandler: DeviceHandler = this.processDeviceHandlerSource(
        existingDeviceHandler.file,
        sourceCode,
        existingDeviceHandler.type
      );
      this.updateDeviceHandlerIfChanged(
        existingDeviceHandler,
        updatedDeviceHandler
      );
      return this._deviceDataStore.updateDeviceHandlerSourceCode(
        id,
        sourceCode
      );
    }
    throw new Error("Device Handler not found.");
  }

  private updateDeviceHandlerIfChanged(
    oldDeviceHandler: DeviceHandler,
    newDeviceHandler: DeviceHandler
  ): void {
    // if any changes are made to the new app excluding client id and client secret, then update.
    // or if there are changes to the client id and client secret and the new app does not have it set to null
    // this is so that it will not clear out client id and client secret that have been set by the user at runtime instead of
    // being defined in the device handler definition.
    if (!newDeviceHandler.equalsIgnoreId(oldDeviceHandler)) {
      logger.debug("udhic Changes for file " + newDeviceHandler.file);
      newDeviceHandler.id = oldDeviceHandler.id;
      this._deviceDataStore.updateDeviceHandler(newDeviceHandler);
    } else {
      // only difference is the id,, so no changes
      logger.debug("No changes for file " + newDeviceHandler.file);
    }
  }

  private processDeviceHandlerSource(
    fileName: string,
    sourceCode: string,
    type: DeviceHandlerType = DeviceHandlerType.USER
  ): DeviceHandler {
    let metadataValue = this.getDeviceHandlerMetadata(sourceCode, fileName);
    let deviceHandler = new DeviceHandler();

    if (metadataValue?.definition) {
      let definition = metadataValue.definition;
      if (definition.deviceHandlerId) {
        deviceHandler.id = definition.deviceHandlerId;
      } else {
        deviceHandler.id = crypto.randomUUID();
      }

      deviceHandler.name = definition.name;
      deviceHandler.namespace = definition.namespace;
      deviceHandler.author = definition.author;
      deviceHandler.capabilityList = definition.capabilities;
      deviceHandler.commandList = definition.commands;
      deviceHandler.fingerprints = definition.fingerprints;
      deviceHandler.file = fileName;
      deviceHandler.type = type;
      deviceHandler.includes = metadataValue.includes;

      return deviceHandler;
    } else {
      throw new Error(`No device definition found for file ${fileName}`);
    }
  }

  private getDeviceHandlerMetadata(sourceCode: string, fileName: string) {
    let deviceMetadataDelegate: DeviceMetadataDelegate =
      new DeviceMetadataDelegate();
    let sandbox = this.buildMetadataSandbox(deviceMetadataDelegate);

    try {
      vm.createContext(sandbox);
      vm.runInContext(sourceCode, sandbox, { filename: fileName });
    } catch (err) {
      if (err.stack.includes("SyntaxError:")) {
        // problem with the code

        let errStack = err.stack.substring(
          0,
          err.stack.indexOf("at DeviceService.processDeviceHandlerSource")
        );
        //TODO: better way to handle this?
        errStack = errStack.substring(0, errStack.lastIndexOf("at "));
        errStack = errStack.substring(0, errStack.lastIndexOf("at "));
        errStack = errStack.substring(0, errStack.lastIndexOf("at "));
        err.message = errStack.trim();
      }
      throw err;
    }

    return deviceMetadataDelegate.metadataValue;
  }

  private buildMetadataSandbox(
    deviceMetadataDelegate: DeviceMetadataDelegate
  ): any {
    let sandbox: any = {};
    sandbox["log"] = new EntityLogger("DEVICE", "NONE", "New Device Handler");
    deviceMetadataDelegate.sandboxMethods.forEach((sandboxMethod: string) => {
      sandbox[sandboxMethod] = (deviceMetadataDelegate as any)[
        sandboxMethod
      ].bind(deviceMetadataDelegate);
    });

    return sandbox;
  }

  public processReturnObj(device: Device, retObj: any): void {
    if (retObj === null || retObj === undefined) {
      return;
    }
    if (Array.isArray(retObj) && retObj.length > 0) {
      this.processArrayRetObj(device, retObj);
    } else if (typeof retObj === "string") {
      this.processStringRetObj(device, retObj);
    } else if (retObj instanceof HubAction) {
      let integrationId: string = device.integration?.id;
      let hubAction: HubAction = retObj as HubAction;
      hubAction.dni = hubAction.dni ?? device.deviceNetworkId;
      if (hubAction.options?.callback) {
        hubAction.options.callbackEntityId = device.id;
        hubAction.options.callbackEntityType = "DEV";
      }
      this.processHubAction(integrationId, hubAction);
    } else if (retObj instanceof HubMultiAction) {
      this.processArrayRetObj(device, retObj.actions);
    } else if (retObj != null) {
      logger.warn("ToDo: process this retObj: " + retObj.getClass().getName());
    }
  }

  private processArrayRetObj(
    device: Device,
    arrayRetObj: Array<any>,
    arrayRetObjIndex: number = 0
  ) {
    if (arrayRetObjIndex < arrayRetObj.length) {
      let delay = 0;
      let obj = arrayRetObj[arrayRetObjIndex];
      if (typeof obj === "string") {
        if (obj.startsWith("delay")) {
          delay = parseInt(obj.substring("delay".length).trim());
        } else {
          this.processStringRetObj(device, obj);
        }
      } else if (obj instanceof HubAction) {
        if (obj.action?.startsWith("delay")) {
          delay = parseInt(obj.action.substring("delay".length).trim());
        } else {
          obj.dni = obj.dni ?? device.deviceNetworkId;
          this.processHubAction(device.integration?.id, obj);
        }
      } else {
        logger.warn("ToDo: process this: " + typeof obj);
      }

      if (delay > 0) {
        setTimeout(
          this.processArrayRetObj.bind(this),
          delay,
          device,
          arrayRetObj,
          arrayRetObjIndex + 1
        );
      } else {
        this.processArrayRetObj(device, arrayRetObj, arrayRetObjIndex + 1);
      }
    }
  }

  private processStringRetObj(device: Device, obj: string): void {
    let msg: string = obj;
    // st = smartthings, ph = Parrot Hub
    if (/(st |he |ph |raw |zdo ).*/.test(msg)) {
      let integrationId: string = device.integration?.id;
      // send to integration or zigbee network.
      this._integrationRegistry.processAction(
        integrationId,
        new HubAction(msg, Protocol.ZIGBEE, device.deviceNetworkId, null)
      );
    } else if (msg.startsWith("delay")) {
      // this should be handled earlier
      return;
    } else {
      // we don't have a protocol, so send to integration if it exists
      if (device.integration) {
        let integrationId = device.integration.id;
        this._integrationRegistry.processAction(
          integrationId,
          new HubAction(msg, Protocol.OTHER, device.deviceNetworkId, null)
        );
      }
    }
    //TODO: process other types of messages
  }

  public processHubAction(
    integrationId: string,
    action: HubAction
  ): HubResponse {
    if (action != null) {
      if (action.action != null && action.action.startsWith("delay")) {
        // this should have been take care of earlier
        return null;
      } else {
        return this._integrationRegistry.processAction(integrationId, action);
      }
    }
    return null;
  }

  private _fingerprints: Map<Fingerprint, string>;

  private getFingerprints(): Map<Fingerprint, string> {
    if (this._fingerprints == null) {
      this._fingerprints = new Map<Fingerprint, string>();

      for (let dhInfo of this.getDeviceHandlers()) {
        let dhInfoFPs = dhInfo.fingerprints;
        if (dhInfoFPs != null) {
          for (let fp of dhInfoFPs) {
            this._fingerprints.set(fp, dhInfo.id);
          }
        }
      }
    }
    return this._fingerprints;
  }

  public getDeviceHandlerByFingerprint(deviceInfo: Map<string, string>): {
    id: string;
    joinName: string;
  } {
    let fingerprints = this.getFingerprints();
    if (logger.isLevelEnabled("debug")) {
      logger.debug(
        "Fingerprints! " + JSON.stringify(Object.fromEntries(fingerprints))
      );
    }
    if (logger.isLevelEnabled("debug")) {
      logger.debug(
        "deviceInfo: " + JSON.stringify(Object.fromEntries(deviceInfo))
      );
    }
    let matchingScore = 0;
    let matchingFingerprint: Fingerprint = null;
    for (let fingerprint of fingerprints.keys()) {
      let score = this.fingerprintScore(fingerprint, deviceInfo);
      if (score > matchingScore) {
        matchingScore = score;
        matchingFingerprint = fingerprint;
      }
    }
    // TODO: what should be the minimum score?
    if (matchingFingerprint != null && matchingScore > 90) {
      if (logger.isDebugEnabled()) {
        logger.debug(
          "We have a matching fingerprint! " +
            matchingFingerprint.deviceJoinName +
            " id: " +
            fingerprints.get(matchingFingerprint) +
            " score: " +
            matchingScore
        );
      }
      return {
        id: fingerprints.get(matchingFingerprint),
        joinName: matchingFingerprint.deviceJoinName,
      };
    }

    // if no match, return Thing
    let thingDeviceHandler = this.getDeviceHandlerByNameAndNamespace(
      "Thing",
      "parrotha.device.virtual"
    );
    if (thingDeviceHandler != null) {
      return { id: thingDeviceHandler.id, joinName: "Unknown Device" };
    }

    return null;
  }

  private fingerprintScore(
    fingerprint: Fingerprint,
    deviceInfo: Map<string, string>
  ): number {
    if (deviceInfo == null || deviceInfo.size == 0) {
      return 0;
    }

    let fingerprintItemCount = 0;
    let deviceInfoItemCount = deviceInfo.size;
    let matchCount = 0;
    let weight = 0;

    let mfrMatch = false;
    let modelMatch = false;
    let prodMatch = false;
    let intgMatch = false;

    if (isNotBlank(fingerprint.profileId)) {
      fingerprintItemCount++;
      if (fingerprint.profileId === deviceInfo.get("profileId")) {
        matchCount++;
        weight += 1;
      }
    }

    if (isNotBlank(fingerprint.endpointId)) {
      fingerprintItemCount++;
      if (
        fingerprint.endpointId.toLowerCase() ===
        deviceInfo.get("endpointId")?.toLowerCase()
      ) {
        matchCount++;
        weight += 1;
      }
    }

    if (isNotBlank(fingerprint.inClusters)) {
      fingerprintItemCount++;
      if (
        fingerprint.inClusters.toLowerCase() ===
        deviceInfo.get("inClusters")?.toLowerCase()
      ) {
        matchCount++;
        weight += 2;
      } else if (
        fingerprint.sortedInClusters.toLowerCase() ===
        deviceInfo.get("inClusters")?.toLowerCase()
      ) {
        matchCount++;
        weight += 1;
      }
    }

    if (isNotBlank(fingerprint.outClusters)) {
      fingerprintItemCount++;
      if (
        fingerprint.outClusters.toLowerCase() ===
        deviceInfo.get("outClusters")?.toLowerCase()
      ) {
        matchCount++;
        weight += 2;
      } else if (
        fingerprint.sortedOutClusters.toLowerCase() ===
        deviceInfo.get("outClusters")?.toLowerCase()
      ) {
        matchCount++;
        weight += 1;
      }
    }

    if (isNotBlank(fingerprint.manufacturer)) {
      fingerprintItemCount++;
      if (fingerprint.manufacturer === deviceInfo.get("manufacturer")) {
        matchCount++;
        weight += 2;
      }
    }

    if (isNotBlank(fingerprint.model)) {
      fingerprintItemCount++;
      if (fingerprint.model === deviceInfo.get("model")) {
        modelMatch = true;
        matchCount++;
        weight += 3;
      }
    }

    if (isNotBlank(fingerprint.mfr)) {
      fingerprintItemCount++;
      if (fingerprint.mfr === deviceInfo.get("mfr")) {
        mfrMatch = true;
        matchCount++;
        weight += 3;
      }
    }

    if (isNotBlank(fingerprint.prod)) {
      fingerprintItemCount++;
      if (fingerprint.prod === deviceInfo.get("prod")) {
        prodMatch = true;
        matchCount++;
        weight += 3;
      }
    }

    if (isNotBlank(fingerprint.intg)) {
      fingerprintItemCount++;
      if (fingerprint.intg === deviceInfo.get("intg")) {
        intgMatch = true;
        matchCount++;
        weight += 3;
      }
    }

    if (
      mfrMatch &&
      modelMatch &&
      prodMatch &&
      intgMatch &&
      fingerprintItemCount == 4
    ) {
      // matched all four, best match
      return 100;
    }

    if (mfrMatch && modelMatch && prodMatch && fingerprintItemCount == 3) {
      // matched all three, best match
      return 99;
    }

    // similar match, all items, slightly less score
    if (fingerprintItemCount == matchCount && weight > 4) {
      return 98;
    }

    // similar match, all items, even less score
    if (fingerprintItemCount == matchCount && weight > 3) {
      return 97;
    }

    let score = Math.round((matchCount / fingerprintItemCount) * 100 + weight);

    return score;
  }
}
