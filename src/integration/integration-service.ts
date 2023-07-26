import { DeviceService } from "../device/device-service";
import { EntityService } from "../entity/entity-service";
import { LanIntegration } from "../lan-integration/lan-integration";
import {
  DeviceEvent,
  DeviceMessageEvent,
  LanDeviceMessageEvent,
} from "./integration-events";

export class IntegrationService {
  private _entityService: EntityService;
  private _deviceService: DeviceService;

  private _lanIntegration: LanIntegration;

  constructor(entityService: EntityService, deviceService: DeviceService) {
    this._entityService = entityService;
    this._deviceService = deviceService;
  }

  public initialize(): Promise<any> {
    this._lanIntegration = new LanIntegration();

    this._lanIntegration.on("event", this.eventReceived.bind(this));
    this._lanIntegration.start();
    return new Promise<any>((resolve) => resolve(true));
  }

  public shutdown(): Promise<any> {
    this._lanIntegration.off("event", this.eventReceived);
    return this._lanIntegration.stop();
  }

  public eventReceived(event: any): void {
    console.log("got event", JSON.stringify(event));
    if (event instanceof DeviceEvent) {
      if (event instanceof DeviceMessageEvent) {
        if (event instanceof LanDeviceMessageEvent) {
          this.lanDeviceMessageReceived(event as LanDeviceMessageEvent);
        } else {
          this._entityService.runDeviceMethodByDNI(
            event.integrationId,
            event.deviceNetworkId,
            "parse",
            [event.message]
          );
        }
      }
    }
  }

  private lanDeviceMessageReceived(event: LanDeviceMessageEvent): void {
    // look for device based on mac address first
    if (
      this._deviceService.deviceExists(
        event.integrationId,
        event.macAddress,
        false
      )
    ) {
      this._entityService.runDeviceMethodByDNI(
        event.integrationId,
        event.macAddress,
        "parse",
        [event.message]
      );
      return;
    }

    let portHexString: string = event.remotePort.toString(16).padStart(4, "0");
    let ipAddressHexString: string = event.remoteAddress
      .split(".")
      .map((element) => parseInt(element).toString(16).padStart(2, "0"))
      .join();

    // next look for device based on ip address : port
    let ipAddressAndPortHexString: string =
      ipAddressHexString + ":" + portHexString;
    if (
      this._deviceService.deviceExists(
        event.integrationId,
        ipAddressAndPortHexString,
        false
      )
    ) {
      this._entityService.runDeviceMethodByDNI(
        event.integrationId,
        ipAddressAndPortHexString,
        "parse",
        [event.message]
      );
      return;
    }

    // look for device based on ip address
    if (
      this._deviceService.deviceExists(
        event.integrationId,
        ipAddressHexString,
        false
      )
    ) {
      this._entityService.runDeviceMethodByDNI(
        event.integrationId,
        ipAddressHexString,
        "parse",
        [event.message]
      );
      return;
    }

    // look for device without integration id

    // look for device based on mac address first
    if (
      this._deviceService.deviceExists(
        event.integrationId,
        event.macAddress,
        true
      )
    ) {
      this._entityService.runDeviceMethodByDNI(
        null,
        event.macAddress,
        "parse",
        [event.message]
      );
      return;
    }

    // next look for device based on ip address : port
    if (
      this._deviceService.deviceExists(
        event.integrationId,
        ipAddressAndPortHexString,
        true
      )
    ) {
      this._entityService.runDeviceMethodByDNI(
        null,
        ipAddressAndPortHexString,
        "parse",
        [event.message]
      );
      return;
    }

    // look for device based on ip address
    if (
      this._deviceService.deviceExists(
        event.integrationId,
        ipAddressHexString,
        true
      )
    ) {
      this._entityService.runDeviceMethodByDNI(
        null,
        ipAddressHexString,
        "parse",
        [event.message]
      );
      return;
    }

    // Finally, send message as hub event if no match above, it appears that Smartthings used to do this.
    // TODO: is lanMessage the right name of the event?  Can't find documentation about it.
    this._entityService.sendHubEvent({
      name: "lanMessage",
      value: event.macAddress,
      description: event.message,
    });
  }
}
