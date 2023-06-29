import { Device } from "../models/device";
import { DeviceHandler } from "../models/device-handler";
import * as crypto from "crypto";
import YAML from "yaml";

const fs = require("fs");
const { NodeVM } = require("vm2");
const path = require("path");

export function sendEvent(eventMap: Map<string, any>) {
  processEvent(eventMap);
}

function processEvent(eventMap: Map<string, any>) {
  console.log(eventMap);
}

let deviceHandlers: Map<string, DeviceHandler> = new Map<
  string,
  DeviceHandler
>();

export function getDeviceHandlers() {
  return Array.from(deviceHandlers.values());
}

let devices: Map<string, Device> = new Map<string, Device>();

export function getDevices() {
  return Array.from(devices.values());
}

export function getDevice(id: string) {
  return devices.get(id);
}

export function addDevice(
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
  devices.set(device.id, device);
  saveDevices();
  return device.id;
}

export function processDeviceHandlers() {
  // list device handlers in directories
  const dhDirFiles: string[] = fs.readdirSync("deviceHandlers/");
  dhDirFiles.forEach((dhDirFile) => {
    if (dhDirFile.endsWith(".js")) {
      const data = fs.readFileSync(`deviceHandlers/${dhDirFile}`);
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
      deviceHandler.namespace = userCodeMetaData.metadata.definition.namespace;
      deviceHandlers.set(deviceHandler.id, deviceHandler);
    }
  });
}

// load devices from file system
export function processDevices() {
  try {
    const devDirFiles: string[] = fs.readdirSync("devices/");
    devDirFiles.forEach((devDirFile) => {
      if (devDirFile.endsWith(".yml")) {
        const data = fs.readFileSync(`devices/${devDirFile}`, "utf-8");
        let parsedFile = YAML.parse(data);
        let device = new Device();
        device.id = parsedFile.id;
        device.name = parsedFile.name;
        device.label = parsedFile.label;
        device.deviceNetworkId = parsedFile.deviceNetworkId;
        device.deviceHandlerId = parsedFile.deviceHandlerId;
        devices.set(device.id, device);
      }
    });
  } catch (err) {
    console.log(err);
  }
}

function saveDevices() {
  fs.mkdirSync('devices/')
  getDevices().forEach((device) => {
    fs.writeFile(`devices/${device.id}.yml`, YAML.stringify(device), (err: any) => {
      if (err) throw err;
      console.log("The file has been saved!");
    });
  });
}

export { deviceHandlers };
