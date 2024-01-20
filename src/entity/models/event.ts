import * as crypto from "crypto";

export class ParrotEvent {
  id: string;
  name: string | undefined;
  value: string | undefined;
  descriptionText: string | undefined;
  displayed: boolean | undefined;
  displayName: string | undefined;
  hubId: string | undefined;
  locationId: string | undefined;
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
      if (properties.source != null) {
        this.source = properties.source.toString();
      } else {
        this.source = "ISA";
      }

      let dataObj = properties.data;
      if (dataObj != null) {
        if (dataObj instanceof Map) {
          this.data = JSON.stringify(Object.fromEntries(dataObj));
        } else if (typeof dataObj === "object") {
          this.data = JSON.stringify(dataObj);
        }
      }

      if (!properties.hasOwnProperty("isStateChange")) {
        this._isStateChange = true;
      } else {
        this._isStateChange = properties.isStateChange;
      }

      // TODO: extract rest of properties
    }
  }

  isStateChange(): boolean {
    return this._isStateChange;
  }

  get description(): string {
    // TODO: return "raw" description
    return null;
  }

  public toString() {
    //TODO: build rest of event
    return "Event(name: " + this.name + " value: " + this.value + ")";
  }

  public toJSON() {
    return { id: this.id, name: this.name, value: this.value, date: this.date };
  }
}
