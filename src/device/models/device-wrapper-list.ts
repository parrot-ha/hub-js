import { EntityWrapper } from "../../entity/models/entity-wrapper";
import { DeviceWrapper } from "./device-wrapper";

export class DeviceWrapperList implements EntityWrapper {
  private _devices: DeviceWrapper[];

  constructor(device: DeviceWrapper[]) {
    this._devices = device;
  }

  getType(): string {
    return "DEVICE-LIST";
  }

  get devices(): DeviceWrapper[] {
    return this._devices;
  }
  
  get id(): string {
    return this._devices?.map((dev) => dev.id)?.join(", ");
  }

  get name(): string {
    return this._devices?.map((dev) => dev.name)?.join(", ");
  }

  get displayName(): string {
    return this._devices?.map((dev) => dev.displayName)?.join(", ");
  }

  forEach(callbackfn: (value: DeviceWrapper, index: number, array: DeviceWrapper[]) => void, thisArg?: any): void {
    this._devices.forEach(callbackfn, thisArg);
  }
}
