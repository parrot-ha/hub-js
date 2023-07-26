import { DeviceHandler } from "./models/device-handler";
import { Device } from "./models/device";

export interface DeviceDataStore {
  getDevices(): Device[];

  getDevicesByCapability(capability: string): Device[];

  getDevice(id: string): Device;

  getDeviceByIntegrationAndDNI(
    integrationId: string,
    deviceNetworkId: string
  ): Device;

  updateDevice(device: Device): void;

  deleteDevice(id: string): boolean;

  createDevice(device: Device): string;

  getDeviceHandlers(): DeviceHandler[];

  getDeviceHandler(id: string): DeviceHandler;

  updateDeviceHandler(deviceHandler: DeviceHandler): void;

  createDeviceHandler(deviceHandler: DeviceHandler): void;

  getDeviceHandlerSources(): Map<string, string>;
}
