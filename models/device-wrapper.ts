import { Device } from "./device";
import { EntityWrapper } from "./entity-wrapper";

export class DeviceWrapper implements EntityWrapper {
    private _device: Device;

    constructor(device: Device) {
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
}