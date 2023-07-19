import { InstalledSmartApp } from "../models/installed-smart-app";
import { SmartApp } from "../models/smart-app";

export interface SmartAppDataStore {
  getInstalledSmartApps(): InstalledSmartApp[];

  getInstalledSmartApp(id: string): InstalledSmartApp;

  getSmartApps(): SmartApp[];

  getSmartApp(id: string): SmartApp;

  getSmartAppSources(): Map<string, string>;

  updateSmartApp(smartApp: SmartApp): void;

  createSmartApp(smartApp: SmartApp): void;

  getInstalledSmartAppsByExtension(extensionId: string): InstalledSmartApp[];

  updateInstalledSmartApp(installedSmartApp: InstalledSmartApp): boolean;

  createInstalledSmartApp(installedSmartApp: InstalledSmartApp): string;

  getChildInstalledSmartApps(parentId: string): InstalledSmartApp[];

  deleteInstalledSmartApp(id: string): boolean;

  getInstalledSmartAppsBySmartApp(smartAppId: string): InstalledSmartApp[];

  deleteSmartApp(id: string): boolean;

  updateInstalledSmartAppState(
    installedSmartAppId: string,
    state: any
  ): boolean;

  getSmartAppSourceCode(id: string): string;

  updateSmartAppSourceCode(id: string, sourceCode: string): boolean;

  createSmartAppSourceCode(sourceCode: string, smartApp: SmartApp): string;

  getInstalledSmartAppsByToken(token: string): string[];

  getOAuthClientIdByToken(token: string): string;
}
