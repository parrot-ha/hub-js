import { DeviceService } from "../services/device-service";
import { Attribute } from "./attribute";
import { Device } from "./device";
import { EntityWrapper } from "./entity-wrapper";
import { State } from "./state";

export class DeviceWrapper implements EntityWrapper {
  private _device: Device;
  private _deviceService: DeviceService;

  constructor(device: Device, deviceService: DeviceService) {
    this._device = device;
    this._deviceService = deviceService;
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

  public currentState(attributeName: string): State {
    return this._device.getCurrentState(attributeName);
  }

  public latestValue(attributeName: string): any {
    if (attributeName == null) {
      return null;
    }

    let state: State = this.currentState(attributeName);
    if (state == null) {
      return null;
    }
    let attribute: Attribute = this._deviceService.getAttributeForDeviceHandler(
      this._device.deviceHandlerId,
      attributeName
    );
    if (attribute == null) {
      return null;
    }
    let dataType: string = attribute.dataType;
    if ("STRING" === dataType || "ENUM" === dataType) {
      return state.stringValue;
    } else if ("NUMBER" === dataType) {
      return state.numberValue;
    } else if ("DATE" === dataType) {
      return state.dateValue;
    } else {
      return null;
    }
  }

  public currentValue(attributeName: string): any {
    return this.latestValue(attributeName);
  }
}
