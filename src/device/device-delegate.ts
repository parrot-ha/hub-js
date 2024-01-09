import { Device } from "./models/device";
import { EntityService } from "../entity/entity-service";
import { EntityDelegate } from "../entity/entity-delegate";
import { DeviceWrapper } from "./models/device-wrapper";
import { DeviceService } from "./device-service";
import { ScheduleService } from "../hub/schedule-service";

export class DeviceDelegate extends EntityDelegate {
  private _device: DeviceWrapper;
  private _entityService: EntityService;
  private _deviceService: DeviceService;
  private _sandboxMethods: string[] = [
    "sendEvent",
    "getChildDevices",
    "addChildDevice",
  ];

  constructor(
    device: Device,
    entityService: EntityService,
    deviceService: DeviceService,
    scheduleService: ScheduleService
  ) {
    super(scheduleService);
    this._device = new DeviceWrapper(device, deviceService);
    this._entityService = entityService;
    this._deviceService = deviceService;
  }

  get sandboxMethods() {
    return super.sandboxMethods.concat(this._sandboxMethods);
  }

  get entityType(): string {
    return "DEVICE";
  }

  get entityId(): string {
    return this._device.id;
  }

  public get device(): DeviceWrapper {
    return this._device;
  }

  sendEvent(eventMap: any) {
    if (this._device?.id) {
      this._entityService.sendDeviceEvent(eventMap, this._device);
    }
  }

  getChildDevices(): DeviceWrapper[] {
    let childDeviceWrappers: DeviceWrapper[] = [];
    let childDevices = this._deviceService.getChildDevicesForDevice(
      this._device.id
    );
    childDevices?.forEach((childDevice) =>
      childDeviceWrappers.push(
        new DeviceWrapper(childDevice, this._deviceService)
      )
    );
    return childDeviceWrappers;
  }

  addChildDevice(
    namespace: string,
    typeName: string,
    deviceNetworkId: string,
    properties: any = {}
  ): DeviceWrapper {
    let childDevice: Device = this._deviceService.addChildDevice(
      this._device.id,
      DeviceService.PARENT_TYPE_DEVICE,
      namespace,
      typeName,
      deviceNetworkId,
      properties
    );
    if (childDevice != null) {
      return new DeviceWrapper(childDevice, this._deviceService);
    } else {
      return null;
    }
  }
}
