import { InstalledSmartApp } from "./models/installed-smart-app";
import { SmartApp } from "./models/smart-app";

export interface SmartAppDataStore {
  getInstalledSmartApps(): InstalledSmartApp[];

  getInstalledSmartApp(id: string): InstalledSmartApp;

  getInstalledSmartAppsByToken(token: string): string[];

  getInstalledSmartAppsByExtension(extensionId: string): InstalledSmartApp[];

  updateInstalledSmartApp(installedSmartApp: InstalledSmartApp): boolean;

  createInstalledSmartApp(installedSmartApp: InstalledSmartApp): string;

  getChildInstalledSmartApps(parentId: string): InstalledSmartApp[];

  deleteInstalledSmartApp(id: string): boolean;

  getInstalledSmartAppsBySmartApp(smartAppId: string): InstalledSmartApp[];

  updateInstalledSmartAppState(
    installedSmartAppId: string,
    state: any
  ): boolean;

  getSmartApps(): SmartApp[];

  getSmartApp(id: string): SmartApp;

  updateSmartApp(smartApp: SmartApp): void;

  createSmartApp(smartApp: SmartApp): void;

  deleteSmartApp(id: string): boolean;

  getSmartAppSources(): Map<string, string>;

  getSmartAppSourceCode(id: string): string;

  updateSmartAppSourceCode(id: string, sourceCode: string): boolean;

  createSmartAppSourceCode(sourceCode: string, smartApp: SmartApp): string;

  getOAuthClientIdByToken(token: string): string;
}
