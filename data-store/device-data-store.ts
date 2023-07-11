import { DeviceHandler } from "../models/device-handler";
import { Device } from "../models/device";

export interface DeviceDataStore {
  getDeviceHandlers(): DeviceHandler[];

  getDevices(): Device[];

  getDevice(id: string): Device;

  getDeviceHandler(id: string): DeviceHandler;

  updateDevice(device: Device): void;

  createDevice(
    integrationId: string,
    deviceHandlerId: string,
    deviceNetworkId: string,
    deviceName: string,
    deviceLabel: string,
    deviceData: any,
    additionalIntegrationParameters: any
  ): string;

  updateDeviceHandler(deviceHandler: DeviceHandler): void;

  createDeviceHandler(deviceHandler: DeviceHandler): void;

  getDeviceHandlerSources(): Map<string, string>;
}
