import * as crypto from "crypto";
import { DeviceHandler } from "../models/device-handler";
import YAML from "yaml";
import { Device } from "../models/device";
import { Event } from "../models/event";

const fs = require("fs");
const { NodeVM } = require("vm2");
const path = require("path");

export class DeviceService {
  private deviceHandlers: Map<string, DeviceHandler> = new Map<
    string,
    DeviceHandler
  >();
  private devices: Map<string, Device> = new Map<string, Device>();

  public constructor() {
    this.processDeviceHandlers();
    this.processDevices();
  }

  public getDeviceHandlers() {
    return Array.from(this.deviceHandlers.values());
  }

  public getDevices() {
    return Array.from(this.devices.values());
  }

  public getDevice(id: string) {
    return this.devices.get(id);
  }

  public getDeviceHandler(id: string) {
    return this.deviceHandlers.get(id);
  }

  public addDevice(
    name: string,
    label: string,
    deviceNetworkId: string,
    deviceHandlerId: string
  ) {
    let device = new Device();
    device.id = crypto.randomUUID();
    device.name = name;
    device.label = label;
    device.deviceNetworkId = deviceNetworkId;
    device.deviceHandlerId = deviceHandlerId;
    this.devices.set(device.id, device);
    this.saveDevices();
    return device.id;
  }

  updateDeviceState(event: Event): void {
    //TODO: store update device state
  }

  private processDeviceHandlers() {
    // list device handlers in directories
    const dhDirFiles: string[] = fs.readdirSync("deviceHandlers/");
    dhDirFiles.forEach((dhDirFile) => {
      if (dhDirFile.endsWith(".js")) {
        let fileName = `deviceHandlers/${dhDirFile}`;
        const data = fs.readFileSync(fileName);
        const testCodeMetadata =
          data.toString() + "\nmodule.exports = { metadata, deviceHandlerId }";
        const mdVm = new NodeVM({
          require: {
            external: true,
          },
          sandbox: {
            settings: {},
          },
        });
        const userCodeMetaData = mdVm.run(testCodeMetadata, {
          filename: "vmmd.js",
          require: (moduleName: string) => {
            return path.resolve(__dirname, moduleName);
          },
        });

        let deviceHandler = new DeviceHandler();
        if (userCodeMetaData.deviceHandlerId != null) {
          deviceHandler.id = userCodeMetaData.deviceHandlerId;
        } else {
          deviceHandler.id = crypto.randomUUID();
        }
        deviceHandler.name = userCodeMetaData.metadata.definition.name;
        deviceHandler.namespace =
          userCodeMetaData.metadata.definition.namespace;
        deviceHandler.file = fileName;
        this.deviceHandlers.set(deviceHandler.id, deviceHandler);
      }
    });
  }

  // load devices from file system
  private processDevices() {
    try {
      const devDirFiles: string[] = fs.readdirSync("devices/");
      devDirFiles.forEach((devDirFile) => {
        if (devDirFile.endsWith(".yaml")) {
          const data = fs.readFileSync(`devices/${devDirFile}`, "utf-8");
          let parsedFile = YAML.parse(data);
          let device = new Device();
          device.id = parsedFile.id;
          device.name = parsedFile.name;
          device.label = parsedFile.label;
          device.deviceNetworkId = parsedFile.deviceNetworkId;
          device.deviceHandlerId = parsedFile.deviceHandlerId;
          this.devices.set(device.id, device);
        }
      });
    } catch (err) {
      console.log(err);
    }
  }

  private saveDevices() {
    fs.mkdirSync("devices/");
    this.getDevices().forEach((device: Device) => {
      fs.writeFile(
        `devices/${device.id}.yaml`,
        YAML.stringify(device),
        (err: any) => {
          if (err) throw err;
          console.log("The file has been saved!");
        }
      );
    });
  }
}
