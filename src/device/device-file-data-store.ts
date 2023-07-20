import { Device } from "./models/device";
import { DeviceHandler } from "./models/device-handler";
import { DeviceDataStore } from "./device-data-store";
import YAML from "yaml";
import fs from "fs";
import * as crypto from "crypto";
const logger = require("../services/logger-service")({
  source: "DeviceFileDataStore",
});

export class DeviceFileDataStore implements DeviceDataStore {
  private _deviceHandlers: Map<string, DeviceHandler>;
  private _devices: Map<string, Device>;
  private _deviceDNItoIdMap: Map<string, string>;

  public getDevices(): Device[] {
    return Array.from(this.getDeviceCache().values());
  }

  public getDevice(id: string): Device {
    return this.getDeviceCache().get(id);
  }

  public updateDevice(device: Device): void {
    let existingDevice: Device = this.getDevice(device.id);
    if (existingDevice != null) {
      // if device network id was updated, update dni to id map
      if (existingDevice.deviceNetworkId !== device.deviceNetworkId) {
        this.getDeviceDNItoIDMap().delete(existingDevice.deviceNetworkId);
        this.getDeviceDNItoIDMap().set(
          device.deviceNetworkId,
          existingDevice.id
        );
        existingDevice.deviceNetworkId = device.deviceNetworkId;
      }
      // TODO: check for changes instead of assigning all values and writing
      existingDevice.deviceHandlerId = device.deviceHandlerId;
      existingDevice.name = device.name;
      existingDevice.name = device.name;

      // handle current states
      existingDevice.currentStates = device.currentStates;
      existingDevice.label = device.label;
      existingDevice.settings = device.settings;
      existingDevice.state = device.state;
      existingDevice.data = device.data;
      existingDevice.updated = new Date();

      // handle integrations (the device class always returns an empty integration if none was set.)
      existingDevice.integration.id = device.integration?.id;

      this.saveDeviceToFile(existingDevice);
    } else {
      throw new Error("Device does not exist");
    }
  }

  public createDevice(device: Device): string {
    let deviceId: string = crypto.randomUUID();
    device.id = deviceId;

    this.addDeviceToCache(device);
    this.saveDeviceToFile(device);

    return deviceId;
  }

  deleteDevice(id: string): boolean {
    //delete file in devices
    // get device
    let device: Device = this.getDevice(id);
    try {
      let fileName: string = `userData/config/devices/${id}.yaml`;
      if (fs.existsSync(fileName)) {
        fs.unlinkSync(fileName);
      }
    } catch (err) {
      logger.warn("Unable to delete device " + id);
      return false;
    }
    try {
      if (device) {
        this.getDeviceDNItoIDMap().delete(
          (device.integration?.id || "null") + ":" + device.deviceNetworkId
        );
      }
      this.getDeviceCache().delete(id);
    } catch (err) {
      logger.warn(err);
    }

    return true;
  }

  private addDeviceToCache(device: Device) {
    this.getDeviceCache().set(device.id, device);
    this.getDeviceDNItoIDMap().set(
      (device.integration?.id || "null") + ":" + device.deviceNetworkId,
      device.id
    );
  }

  private getDeviceCache(): Map<string, Device> {
    if (!this._devices) {
      this.loadDevices();
    }
    return this._devices;
  }

  private getDeviceDNItoIDMap(): Map<string, string> {
    if (!this._deviceDNItoIdMap) {
      this.loadDevices();
    }
    return this._deviceDNItoIdMap;
  }

  private loadDevices(): void {
    if (this._devices) {
      return;
    }

    let newDevices: Map<string, Device> = new Map<string, Device>();
    let newDeviceDNItoIdMap: Map<string, string> = new Map<string, string>();

    try {
      const devDirFiles: string[] = fs.readdirSync("userData/config/devices/");
      devDirFiles.forEach((devDirFile) => {
        try {
          if (devDirFile.endsWith(".yaml")) {
            const data = fs.readFileSync(
              `userData/config/devices/${devDirFile}`,
              "utf-8"
            );
            let parsedFile = YAML.parse(data);
            let device: Device = Device.fromJSON(parsedFile);
            newDevices.set(device.id, device);
            newDeviceDNItoIdMap.set(
              (device.integration?.id || "null") +
                ":" +
                device.deviceNetworkId.toUpperCase(),
              device.id
            );
          }
        } catch (err) {
          logger.warn(`Error loading file ${devDirFile}`);
        }
      });
    } catch (err) {
      logger.warn(
        `Error loading files from userData/config/devices/: ${err.message}`
      );
    }
    this._devices = newDevices;
    this._deviceDNItoIdMap = newDeviceDNItoIdMap;
  }

  private saveDeviceToFile(device: Device) {
    let deviceYaml = YAML.stringify(device.toJSON());
    if (deviceYaml?.trim().length > 0) {
      fs.writeFile(
        `userData/config/devices/${device.id}.yaml`,
        deviceYaml,
        (err: any) => {
          if (err) throw err;
          logger.debug(`The device file ${device.id} has been saved!`);
        }
      );
    }
  }

  /*
   * Device Handler functions
   */

  public getDeviceHandlers(): DeviceHandler[] {
    return Array.from(this.getDeviceHandlerCache().values());
  }

  public getDeviceHandler(id: string): DeviceHandler {
    return this.getDeviceHandlerCache().get(id);
  }

  private getDeviceHandlerCache(): Map<string, DeviceHandler> {
    if (!this._deviceHandlers) {
      this._deviceHandlers = this.loadDeviceHandlerConfig();
    }
    return this._deviceHandlers;
  }

  updateDeviceHandler(deviceHandler: DeviceHandler): void {
    this.getDeviceHandlerCache().set(deviceHandler.id, deviceHandler);
    this.saveDeviceHandlers();
  }

  createDeviceHandler(deviceHandler: DeviceHandler): void {
    this.getDeviceHandlerCache().set(deviceHandler.id, deviceHandler);
    this.saveDeviceHandlers();
  }

  public getDeviceHandlerSources(): Map<string, string> {
    let deviceHandlerSourceList: Map<string, string> = new Map<
      string,
      string
    >();

    // load device handlers from text files in user data directory
    try {
      let dhFilePath: string = "userData/deviceHandlers/";
      const dhDirFiles: string[] = fs.readdirSync(dhFilePath);
      dhDirFiles.forEach((dhDirFile) => {
        if (dhDirFile.endsWith(".js")) {
          let fileName = `${dhFilePath}${dhDirFile}`;
          try {
            deviceHandlerSourceList.set(
              fileName,
              fs.readFileSync(fileName)?.toString()
            );
          } catch (err) {
            logger.warn(
              "error processing user device handler file",
              fileName,
              err
            );
          }
        }
      });
    } catch (err) {
      logger.warn("error loading user device handler directory", err);
    }
    return deviceHandlerSourceList;
  }

  private saveDeviceHandlers(): void {
    if (this.getDeviceHandlerCache()?.size > 0) {
      try {
        fs.writeFile(
          "userData/config/deviceHandlers.yaml",
          YAML.stringify(this.getDeviceHandlerCache().values()),
          (err: any) => {
            if (err) throw err;
            logger.debug("device handler config file has been saved!");
          }
        );
      } catch (err) {
        logger.warn("error when saving device handler config file", err);
      }
    }
  }

  // load config file on file system instead of processing through the device handler files
  private loadDeviceHandlerConfig(): Map<string, DeviceHandler> {
    let deviceHandlerInfo: Map<string, DeviceHandler> = new Map<
      string,
      DeviceHandler
    >();
    try {
      const deviceHandlersConfigFile = fs.readFileSync(
        "userData/config/deviceHandlers.yaml",
        "utf-8"
      );
      if (deviceHandlersConfigFile) {
        let parsedFile = YAML.parse(deviceHandlersConfigFile);
        if (parsedFile && Array.isArray(parsedFile)) {
          parsedFile.forEach((fileDH) => {
            let deviceHandler: DeviceHandler = fileDH as DeviceHandler;
            deviceHandlerInfo.set(deviceHandler.id, deviceHandler);
          });
        }
      }
    } catch (err) {
      logger.warn(err);
    }
    return deviceHandlerInfo;
  }
}
