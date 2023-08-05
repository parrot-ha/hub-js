import { Device } from "../models/device";

export class DeviceHandlerInUseError extends Error {
  private _devices: Device[];
  constructor(message: string, devices: Device[]) {
    super(message);
    this._devices = devices;
  }
  public get devices(): Device[] {
    return this._devices;
  }
}
