import { DeviceService } from "../device-service";
import { Attribute } from "./attribute";
import { Device } from "./device";
import { EntityWrapper } from "../../entity/models/entity-wrapper";
import { State } from "./state";
import { hexStringToInt } from "../../utils/hex-utils";
import { EntityService } from "../../entity/entity-service";

export class DeviceWrapper implements EntityWrapper {
  private _device: Device;
  private _deviceService: DeviceService;
  private _entityService: EntityService;

  constructor(device: Device, deviceService: DeviceService, entityService: EntityService) {
    this._device = device;
    this._deviceService = deviceService;
    this._entityService = entityService;
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

  get displayName(): string {
    return this._device.displayName;
  }

  get deviceNetworkId(): string {
    return this._device.deviceNetworkId;
  }

  set deviceNetworkId(deviceNetworkId: string) {
    if (this._deviceService == null) {
      throw new Error("DeviceNetworkId is currently not updatable");
    }
    this._device.deviceNetworkId = deviceNetworkId;
    this._deviceService.saveDevice(this._device);
  }

  get endpointId(): number {
    if (this._device.integration != null) {
      let endpointIdObj = this._device.integration.options["endpointId"];
      if (endpointIdObj != null) {
        if (typeof endpointIdObj === "string") {
          return hexStringToInt(endpointIdObj);
        } else if (typeof endpointIdObj === "number") {
          return Math.floor(endpointIdObj);
        }
      }
    }
    return null;
  }

  get zigbeeId(): string {
    if (this._device.integration != null) {
      return this._device.integration.options["zigbeeId"] as string;
    }
    return null;
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

  sendEvent(eventMap: any) {
    if (this._device?.id) {
      this._entityService.sendDeviceEvent(eventMap, this);
    }
  }
}
