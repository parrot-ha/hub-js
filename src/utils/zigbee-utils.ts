import { DeviceWrapper } from "../device/models/device-wrapper";
import { toInteger } from "./object-utils";

export class ZigBeeUtils {
  private _device: DeviceWrapper;

  private static DEFAULT_DELAY: number = 2000;

  constructor(device: DeviceWrapper) {
    this._device = device;
  }

  public on(delay: any): Array<string> {
    let delayInt;
    if (delay == null) delayInt = ZigBeeUtils.DEFAULT_DELAY;
    else delayInt = toInteger(delay);

    let arrayList: Array<string> = new Array<string>();
    arrayList.push(
      `ph cmd 0x${this._device.deviceNetworkId} 0x${this._device.endpointId} 6 1 {}`
    );
    if (delayInt > 0) {
      arrayList.push("delay " + delayInt);
    }
    return arrayList;
  }

  public off(delay: any): Array<string> {
    let delayInt;
    if (delay == null) delayInt = ZigBeeUtils.DEFAULT_DELAY;
    else delayInt = toInteger(delay);

    let arrayList: Array<string> = new Array<string>();
    arrayList.push(
      `ph cmd 0x${this._device.deviceNetworkId} 0x${this._device.endpointId} 6 0 {}`
    );
    if (delayInt > 0) {
      arrayList.push("delay " + delayInt);
    }
    return arrayList;
  }
}
