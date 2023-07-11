import { DeviceSetting } from "./device-setting";
import { Integration } from "./integration";

export class Device {
  id: string | undefined;
  deviceHandlerId: string | undefined;
  name: string | undefined;
  label: string | undefined;
  deviceNetworkId: string | undefined;
  parentDeviceId: string | undefined;
  parentSmartApp: string | undefined;
  private _integration: Integration;
  state: any | undefined;
  data: any | undefined;
  //currentStates: Map<string, State> | undefined;
  settings: DeviceSetting[] | undefined;
  created: Date | undefined;
  updated: Date | undefined;

  public get displayName() {
    if (!this.label) {
      return this.name;
    }
    return this.label;
  }

  public addSetting(deviceSetting: DeviceSetting) {
    if (!this.settings) {
      this.settings = [];
    }
    this.settings.push(deviceSetting);
  }

  get integration() {
    if (!this._integration) {
      this._integration = new Integration();
    }
    return this._integration;
  }

  set integration(integration: Integration) {
    this._integration = integration;
  }

  // public toJSON() {
  //   return {
  //     id: this.id,
  //     deviceHandlerId: this.deviceHandlerId,
  //     name: this.name,
  //     label: this.label,
  //     displayName: this.displayName,
  //     deviceNetworkId: this.deviceNetworkId,
  //   };
  // }
}
