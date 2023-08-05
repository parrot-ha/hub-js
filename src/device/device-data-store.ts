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

  getDevicesByDeviceHandler(deviceHandlerId: string): Device[];

  updateDevice(device: Device): void;

  deleteDevice(id: string): boolean;

  createDevice(device: Device): string;

  getDeviceChildDevices(parentDeviceId: string): Device[];

  getDeviceHandlers(): DeviceHandler[];

  getDeviceHandler(id: string): DeviceHandler;

  updateDeviceHandler(deviceHandler: DeviceHandler): void;

  createDeviceHandler(deviceHandler: DeviceHandler): void;

  deleteDeviceHandler(id: string): boolean;

  getDeviceHandlerSources(): Map<string, string>;

  getDeviceHandlerSourceCode(id: string): string;

  updateDeviceHandlerSourceCode(id: string, sourceCode: string): boolean;

  createDeviceHandlerSourceCode(
    sourceCode: string,
    deviceHandler: DeviceHandler
  ): string;

  getDeviceHandlerByNamespaceAndName(
    namespace: string,
    name: string
  ): DeviceHandler;

  getDeviceHandlerByName(name: string): DeviceHandler;
}
