import { InstalledSmartAppSetting } from "./installed-smart-app-setting";

export class InstalledSmartApp {
  id: string | undefined;
  label: string | undefined;
  smartAppId: string | undefined;
  installed: boolean = false;
  settings: InstalledSmartAppSetting[] | undefined;
  state: Map<string, any> | undefined;
  parentInstalledSmartAppId: string | undefined;
}
