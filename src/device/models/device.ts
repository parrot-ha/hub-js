import { DeviceSetting } from "./device-setting";
import { Integration } from "../../hub/models/integration";
import { State } from "./state";

export class Device {
  id: string | undefined;
  deviceHandlerId: string | undefined;
  name: string | undefined;
  label: string | undefined;
  deviceNetworkId: string | undefined;
  parentDeviceId: string | undefined;
  parentInstalledSmartAppId: string | undefined;
  private _integration: Integration;
  private _state: any | undefined;
  data: any | undefined;
  private _currentStates: Map<string, State>;
  settings: DeviceSetting[] | undefined;
  created: Date | undefined;
  updated: Date | undefined;

  // transient value
  private _nameToSettingMap: Map<string, DeviceSetting>;

  public get state() {
    if (this._state === null || typeof this._state === "undefined") {
      this._state = {};
    }
    return this._state;
  }

  public set state(state: any) {
    this._state = state;
  }

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

  public getSettingByName(name: string): DeviceSetting {
    if (this.getNameToSettingMap() != null) {
      return this.getNameToSettingMap().get(name);
    } else {
      return null;
    }
  }

  public getNameToSettingMap(): Map<string, DeviceSetting> {
    if (!this._nameToSettingMap && this.settings) {
      let newNameToSettingMap: Map<string, DeviceSetting> = new Map<
        string,
        DeviceSetting
      >();
      for (let setting of this.settings) {
        newNameToSettingMap.set(setting.name, setting);
      }
      this._nameToSettingMap = newNameToSettingMap;
    }
    return this._nameToSettingMap;
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

  public get currentStates(): Map<string, State> {
    return this._currentStates;
  }

  public set currentStates(currentStates: Map<string, State>) {
    this._currentStates = currentStates;
  }

  public getCurrentState(attributeName: string): State {
    if (!this._currentStates) {
      return null;
    }
    return this._currentStates.get(attributeName);
  }

  public setCurrentState(state: State): void {
    if (!this._currentStates) {
      this._currentStates = new Map<string, State>();
    }
    this._currentStates.set(state.name, state);
  }

  public toJSON() {
    return {
      id: this.id,
      deviceHandlerId: this.deviceHandlerId,
      name: this.name,
      label: this.label,
      deviceNetworkId: this.deviceNetworkId,
      parentDeviceId: this.parentDeviceId,
      parentInstalledSmartAppId: this.parentInstalledSmartAppId,
      integration: this.integration,
      state: this.state,
      data: this.data,
      currentStates: this._currentStates,
      settings: this.settings,
      created: this.created,
      updated: this.updated,
    };
  }

  public static fromJSON(json: any) {
    let d: Device = new Device();
    if (json != null && typeof json === "object") {
      d.id = json.id;
      d.deviceHandlerId = json.deviceHandlerId;
      d.name = json.name;
      d.label = json.label;
      d.deviceNetworkId = json.deviceNetworkId;
      d.parentDeviceId = json.parentDeviceId;
      d.parentInstalledSmartAppId = json.parentInstalledSmartAppId;
      d.integration = json.integration;
      d.state = json.state;
      d.data = json.data;
      d.currentStates = new Map();
      if (json.currentStates) {
        Object.entries(json.currentStates).forEach((entry) => {
          d.currentStates.set(entry[0], State.fromJSON(entry[1]));
        });
      }
      if (json.settings && Array.isArray(json.settings)) {
        json.settings.forEach((setting: any) => {
          d.addSetting(DeviceSetting.buildFromObject(setting));
        });
      }

      d.created = json.created;
      d.updated = json.updated;
    }
    return d;
  }
}
