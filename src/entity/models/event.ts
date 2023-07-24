import * as crypto from "crypto";

export class ParrotEvent {
  id: string;
  name: string | undefined;
  value: string | undefined;
  descriptionText: string | undefined;
  displayed: boolean | undefined;
  displayName: string | undefined;
  private _isStateChange: boolean;
  unit: string | undefined;
  data: string | undefined;
  date: Date;
  source: string | undefined;
  sourceId: string | undefined;
  isDigital: boolean | undefined;

  constructor(properties: any) {
    this.id = crypto.randomUUID();
    this.date = new Date();
    this._isStateChange = false;
    if (properties != null) {
      if (properties.name) {
        this.name = properties.name;
      }
      if (properties.value) {
        this.value = properties.value.toString();
      }
      // TODO: check if state change
      this._isStateChange = true;

      // TODO: extract rest of properties
    }
  }

  isStateChange(): boolean {
    return this._isStateChange;
  }

  public toString() {
    //TODO: build rest of event
    return "Event(name: " + this.name + " value: " + this.value + ")";
  }
}
