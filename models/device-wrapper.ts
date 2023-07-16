import { DeviceService } from "../services/device-service";
import { Device } from "./device";
import { EntityWrapper } from "./entity-wrapper";

export class DeviceWrapper implements EntityWrapper {
  private _device: Device;
  private _deviceService: DeviceService;

  constructor(device: Device, deviceService: DeviceService) {
    this._device = device;
  }
  getType(): string {
    return "DEVICE";
  }

  get id(): string {
    return this._device.id;
  }

  get name(): string {
    return this._device.name;
  }

  get deviceNetworkId(): string {
    return this._device.deviceNetworkId;
  }

  set setDeviceNetworkId(deviceNetworkId: string) {
    if (this._deviceService == null) {
      throw new Error("DeviceNetworkId is currently not updatable");
    }
    this._device.deviceNetworkId = deviceNetworkId;
    this._deviceService.saveDevice(this._device);
  }
}
