import { DeviceWrapper } from "../../device/models/device-wrapper";
import { Location } from "../../hub/models/location";
import { ParrotEvent } from "./event";
import { ServiceFactory } from "../../hub/service-factory";

export class ParrotEventWrapper {
  private _event: ParrotEvent;

  constructor(event: ParrotEvent) {
    this._event = event;
  }

  /**
   * A map of any additional data on the Event.
   *
   * @return string - A JSON string representing a map of the additional data (if any) on the Event.
   */
  get data(): string {
    return this._event.data;
  }

  get id(): string {
    return this._event.id;
  }

  get name(): string {
    return this._event.name;
  }

  get value(): string {
    return this._event.value;
  }

  get date(): Date {
    return this._event.date;
  }

  get descriptionText(): string {
    return this._event.descriptionText;
  }

  isDisplayed(): boolean {
    return this._event.displayed;
  }

  get displayName(): string {
    return this._event.displayName;
  }

  public isStateChange(): boolean {
    return this._event.isStateChange();
  }

  get unit(): string {
    return this._event.unit;
  }

  get dateValue(): Date {
    //parse value into date
    return new Date(Date.parse(this._event.value));
  }

  get description(): string {
    return this._event.description;
  }

  get device(): DeviceWrapper {
    if (this.deviceId)
      return new DeviceWrapper(
        ServiceFactory.getInstance()
          .getDeviceService()
          .getDevice(this.deviceId),
        ServiceFactory.getInstance().getDeviceService()
      );
    return null;
  }

  get deviceId(): string {
    if ("DEVICE" === this._event.source) return this._event.sourceId;
    return null;
  }

  get hubId(): string {
    return this._event.hubId;
  }

  get installedSmartAppId(): string {
    if ("SMARTAPP" === this._event.source) return this._event.sourceId;
    return null;
  }

  get isoDate(): string {
    return this.dateValue?.toISOString();
  }

  get jsonValue(): any {
    return JSON.parse(this._event.value);
  }

  get linkText(): string {
    return this.displayName;
  }

  //TODO: return LocationWrapper
  get location(): Location {
    //TODO: implement
    throw new Error("Not Yet Implemented");
  }

  get locationId(): string {
    return this._event.locationId;
  }

  get integerValue(): number {
    //This is just here for backwards compatibility, there is no Integer in javascript/typescript
    return this.numberValue;
  }

  get doubleValue(): number {
    //This is just here for backwards compatibility, there is no Double in javascript/typescript
    return this.numberValue;
  }

  get floatValue(): number {
    //This is just here for backwards compatibility, there is no Float in javascript/typescript
    return this.numberValue;
  }

  get longValue(): number {
    //This is just here for backwards compatibility, there is no Long in javascript/typescript
    return this.numberValue;
  }

  get numberValue(): number {
    return Number(this._event.value);
  }

  get numericValue(): number {
    return this.numberValue;
  }

  get source(): string {
    return this._event.source;
  }

  get sourceId(): string {
    return this._event.sourceId;
  }

  get stringValue(): string {
    return this._event.value;
  }

  get xyzValue(): any {
    return JSON.parse(this.value);
  }

  isDigital(): boolean {
    return this._event.isDigital;
  }

  isPhysical(): boolean {
    return !this.isDigital();
  }

  public toString() {
    //TODO: build rest of event
    return "Event(name: " + this.name + " value: " + this.value + ")";
  }

  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      value: this.value,
      date: this.date,
      source: this.source,
      sourceId: this.sourceId,
      descriptionText: this.descriptionText,
      isStateChange: this.isStateChange,
    };
  }
}
