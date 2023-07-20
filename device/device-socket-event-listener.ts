import { Event } from "../models/event";
import { EventListener } from "../entity/event-listener";
export class DeviceSocketEventListener implements EventListener {
  private _deviceId: string;
  private _webSocket: any;
  private _registered: boolean = false;

  constructor(deviceId: string, webSocket: any) {
    this._deviceId = deviceId;
    this._webSocket = webSocket;
    this._registered = true;
  }

  public unregisterWS(): void {
    this._deviceId = null;
    this._webSocket = null;
    this._registered = false;
  }

  eventReceived(event: Event): void {
    if (
      this._registered &&
      event != null &&
      "DEVICE" == event.source &&
      event.sourceId === this._deviceId
    ) {
      // process event
      let eventMessage: string = JSON.stringify({
        name: event.name,
        value: event.value,
        unit: event.unit,
      });

      this._webSocket.send(eventMessage);
    }
  }
}
