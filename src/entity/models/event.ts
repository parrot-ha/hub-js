import * as crypto from "crypto";
import { DeviceWrapper } from "../../device/models/device-wrapper";
import { State } from "../../device/models/state";

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

  constructor(properties: any, deviceWrapper: DeviceWrapper = null) {
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

      if (deviceWrapper != null) {
        this.source = "DEVICE";
        this.sourceId = deviceWrapper.id;
        this.displayName = deviceWrapper.displayName;

        if (!properties.hasOwnProperty("isStateChange")) {
          // populate "is state change"
          let currentState: State = deviceWrapper.currentState(this.name);
          if (currentState == null) {
            this._isStateChange = true;
          } else if (this.value != null) {
            this._isStateChange = this.value != currentState.value;
          } else {
            this._isStateChange = false;
          }
        } else {
          this._isStateChange = properties.isStateChange;
        }
      } else {
        if (!properties.hasOwnProperty("isStateChange")) {
          this._isStateChange = true;
        } else {
          this._isStateChange = properties.isStateChange;
        }
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
