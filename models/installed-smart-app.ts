import { InstalledSmartAppSetting } from "./installed-smart-app-setting";

export class InstalledSmartApp {
  id: string | undefined;
  label: string | undefined;
  smartAppId: string | undefined;
  installed: boolean = false;
  settings: InstalledSmartAppSetting[] | undefined;
  state: Map<string, any> | undefined;
  parentInstalledSmartAppId: string | undefined;

  // transient
  name: string;
  namespace: string;

  public get displayName(): string {
    if (!this.label) {
      return this.name;
    }
    return this.label;
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
    };
  }
}
