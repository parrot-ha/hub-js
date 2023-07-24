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

const fs = require("fs");
const vm = require("vm");

export class DeviceService {
  private _deviceDataStore: DeviceDataStore;

  public constructor(deviceDataStore: DeviceDataStore) {
    this._deviceDataStore = deviceDataStore;
  }

  public getDeviceHandlers() {
    return this._deviceDataStore.getDeviceHandlers();
  }

  public getDevices() {
    return this._deviceDataStore.getDevices();
  }

  public getDevice(id: string) {
    return this._deviceDataStore.getDevice(id);
  }

  public getDeviceHandler(id: string) {
    return this._deviceDataStore.getDeviceHandler(id);
  }

  public getDevicesByCapability(capability: string): Device[] {
    return this._deviceDataStore.getDevicesByCapability(capability);
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
    //TODO: call integration to remove device, for now just delete from db
    return new Promise((resolve) => {
      resolve(this._deviceDataStore.deleteDevice(id));
    });
  }

  public cancelRemoveDeviceAsync(id: string): void {
    // TODO: call integration and cancel remove device if it supports that.
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
    console.log("shutting down device service");
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
            //logger.debug("Changes for file " + fileName);
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
          console.log("error processing system device handler files", err);
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

  updateDeviceState(event: ParrotEvent): void {
    let d: Device = this._deviceDataStore.getDevice(event.sourceId);
    let s: State = new State(event.name, event.value, event.unit);
    d.setCurrentState(s);
    //TODO: store state history in database
    //TODO: use write behind cache for saving device
    this._deviceDataStore.updateDevice(d);
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

  private processDeviceHandlerSource(
    fileName: string,
    sourceCode: string,
    type: DeviceHandlerType = DeviceHandlerType.USER
  ): DeviceHandler {
    let deviceMetadataDelegate: DeviceMetadataDelegate =
      new DeviceMetadataDelegate();
    let sandbox = this.buildMetadataSandbox(deviceMetadataDelegate);

    vm.createContext(sandbox);
    vm.runInContext(sourceCode, sandbox, { filename: fileName });

    let deviceHandler = new DeviceHandler();

    if (deviceMetadataDelegate.metadataValue?.definition) {
      let definition = deviceMetadataDelegate.metadataValue.definition;
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
      deviceHandler.file = fileName;
      deviceHandler.type = type;
      return deviceHandler;
    } else {
      throw new Error(`No device definition found for file ${fileName}`);
    }
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
}
