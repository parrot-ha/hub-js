import { InstalledSmartAppSetting } from "./installed-smart-app-setting";

export class InstalledSmartApp {
  id: string | undefined;
  label: string | undefined;
  smartAppId: string | undefined;
  installed: boolean = false;
  settings: InstalledSmartAppSetting[] | undefined;
  private _state: any;
  parentInstalledSmartAppId: string | undefined;
  modes: string[]; // list of modes to run in

  // transient
  name: string;
  namespace: string;

  public get displayName(): string {
    if (!this.label) {
      return this.name;
    }
    return this.label;
  }

  public get state() {
    if (this._state === null || this._state === undefined) {
      this._state = {};
    }
    return this._state;
  }

  public set state(state: any) {
    this._state = state;
  }

  public getSettingByName(name: string): InstalledSmartAppSetting {
    if (this.settings) {
      return this.settings.find((setting) => setting.name === name);
    } else {
      return null;
    }
  }

  public addSetting(setting: InstalledSmartAppSetting): void {
    if (this.settings == null) {
      this.settings = [];
    }
    this.settings.push(setting);
  }

  public toJSON() {
    return {
      id: this.id,
      label: this.label,
      smartAppId: this.smartAppId,
      installed: this.installed,
      settings: this.settings,
      state: this.state,
      parentInstalledSmartAppId: this.parentInstalledSmartAppId,
      modes: this.modes,
    };
  }
}
