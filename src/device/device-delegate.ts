import { Device } from "./models/device";
import { EntityService } from "../entity/entity-service";
import { EntityDelegate } from "../entity/entity-delegate";

export class DeviceDelegate extends EntityDelegate {
  private _device: Device;
  private _entityService: EntityService;

  private _sandboxMethods: string[] = ["sendEvent"];

  get sandboxMethods() {
    return super.sandboxMethods.concat(this._sandboxMethods);
  }

  public get device(): Device {
    return this._device;
  }
  constructor(device: Device, entityService: EntityService) {
    super();
    this._device = device;
    this._entityService = entityService;
  }

  sendEvent(eventMap: Map<string, any>) {
    if (this._device?.id) {
      this._entityService.sendDeviceEvent(eventMap, this._device.id);
    }
  }
}
