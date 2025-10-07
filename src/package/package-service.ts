import { PackageFileDataStore } from "./package-file-data-store";

const logger = require("../hub/logger-service")({ source: "PackageService" });

export class PackageService {
  private _packageDataStore: PackageFileDataStore;
  constructor(packageDataStore: PackageFileDataStore) {
    this._packageDataStore = packageDataStore;
  }

  public getPackages(): string[] {
    return this._packageDataStore.getPackages();
  }
}