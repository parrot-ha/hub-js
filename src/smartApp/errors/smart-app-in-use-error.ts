import { InstalledSmartApp } from "../models/installed-smart-app";

export class SmartAppInUseError extends Error {
  private _installedSmartApps: InstalledSmartApp[];
  constructor(message: string, installedSmartApps: InstalledSmartApp[]) {
    super(message);
    this._installedSmartApps = installedSmartApps;
  }
  public get installedSmartApps(): InstalledSmartApp[] {
    return this._installedSmartApps;
  }
}
