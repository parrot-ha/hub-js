import { DeviceHandler } from "../models/device-handler";
import { Device } from "../models/device";

export interface DeviceDataStore {

  getDevices(): Device[];

  getDevice(id: string): Device;

  updateDevice(device: Device): void;

  deleteDevice(id: string): boolean;

  createDevice(
    integrationId: string,
    deviceHandlerId: string,
    deviceNetworkId: string,
    deviceName: string,
    deviceLabel: string,
    deviceData: any,
    additionalIntegrationParameters: any
  ): string;

  getDeviceHandlers(): DeviceHandler[];

  getDeviceHandler(id: string): DeviceHandler;

  updateDeviceHandler(deviceHandler: DeviceHandler): void;

  createDeviceHandler(deviceHandler: DeviceHandler): void;

  getDeviceHandlerSources(): Map<string, string>;
}
