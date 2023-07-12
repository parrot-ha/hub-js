import * as crypto from "crypto";
import { DeviceHandler, DeviceHandlerType } from "../models/device-handler";
import YAML from "yaml";
import { Device } from "../models/device";
import { Event } from "../models/event";
import { Logger } from "./logger-service";
import { DeviceMetadataDelegate } from "../delegates/device-metadata-delegate";
import { DeviceDataStore } from "../data-store/device-data-store";

const fs = require("fs");
const { NodeVM } = require("vm2");
const path = require("path");

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

  public addDevice(
    integrationId: string,
    deviceHandlerId: string,
    deviceNetworkId: string,
    deviceName: string,
    deviceLabel: string,
    deviceData: any,
    additionalIntegrationParameters: any
  ) {
    if (deviceName == null) {
      deviceName = this._deviceDataStore.getDeviceHandler(deviceHandlerId).name;
    }
    return this._deviceDataStore.createDevice(
      integrationId,
      deviceHandlerId,
      deviceNetworkId,
      deviceName,
      deviceLabel,
      deviceData,
      additionalIntegrationParameters
    );
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

  public shutdown(): void {
    console.log("shutting down device service");
    //TODO: handle extensions
    // if (extensionService != null) {
    //     extensionService.unregisterStateListener(this);
    // }
  }

  public reprocessDeviceHandlers(): void {
    // run this process in the background, allows quicker start up of system at the
    // expense of system starting up with possibly old device handler definition, however
    // this should be quickly rectified once system is fully running
    new Promise(() => {
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
    });
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

  updateDeviceState(event: Event): void {
    //TODO: store update device state
  }

  public getDeviceHandlerPreferencesLayout(deviceHandlerId: string): any {
    let deviceHandler: DeviceHandler = this.getDeviceHandler(deviceHandlerId);
    if (deviceHandler) {
      const data = fs.readFileSync(deviceHandler.file);
      const testCodeMetadata = data.toString();
      let deviceMetadataDelegate: DeviceMetadataDelegate =
        new DeviceMetadataDelegate(false, true);
      let sandbox = this.buildMetadataSandbox(deviceMetadataDelegate);
      const mdVm = new NodeVM({
        sandbox: sandbox,
      });
      mdVm.run(testCodeMetadata, {
        filename: deviceHandler.file,
      });
      return deviceMetadataDelegate.metadataValue?.preferences;
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
    const mdVm = new NodeVM({
      sandbox: sandbox,
    });
    mdVm.run(sourceCode, {
      filename: fileName,
    });

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
    sandbox["log"] = Logger;
    deviceMetadataDelegate.sandboxMethods.forEach((sandboxMethod: string) => {
      sandbox[sandboxMethod] = (deviceMetadataDelegate as any)[
        sandboxMethod
      ].bind(deviceMetadataDelegate);
    });

    return sandbox;
  }
}
