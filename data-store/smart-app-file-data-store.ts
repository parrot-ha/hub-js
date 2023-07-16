import { SmartApp } from "../models/smart-app";
import { InstalledSmartApp } from "../models/installed-smart-app";
import { SmartAppDataStore } from "./smart-app-data-store";
import { InstalledSmartAppSetting } from "../models/installed-smart-app-setting";

import YAML from "yaml";
import fs from "fs";

const winston = require("winston");
const logger = winston.loggers.get("parrotLogger");

export class SmartAppFileDataStore implements SmartAppDataStore {
  getInstalledSmartAppsByExtension(extensionId: string): InstalledSmartApp[] {
    throw new Error("Method not implemented.");
  }

  updateInstalledSmartApp(installedSmartApp: InstalledSmartApp): boolean {
    let existingInstalledSmartApp: InstalledSmartApp =
      this.getInstalledSmartApp(installedSmartApp.id);
    existingInstalledSmartApp.installed = installedSmartApp.installed;
    existingInstalledSmartApp.label = installedSmartApp.label;
    existingInstalledSmartApp.settings = installedSmartApp.settings;
    return this.saveInstalledSmartApp(installedSmartApp.id);
  }

  createInstalledSmartApp(installedSmartApp: InstalledSmartApp): string {
    throw new Error("Method not implemented.");
  }
  getChildInstalledSmartApps(parentId: string): InstalledSmartApp[] {
    throw new Error("Method not implemented.");
  }
  deleteInstalledSmartApp(id: string): boolean {
    throw new Error("Method not implemented.");
  }
  getInstalledSmartAppsBySmartApp(smartAppId: string): InstalledSmartApp[] {
    throw new Error("Method not implemented.");
  }
  updateInstalledSmartAppState(
    installedSmartAppId: string,
    state: Map<string, any>
  ): boolean {
    throw new Error("Method not implemented.");
  }
  getInstalledSmartAppsByToken(token: string): string[] {
    throw new Error("Method not implemented.");
  }
  getOAuthClientIdByToken(token: string): string {
    throw new Error("Method not implemented.");
  }

  private _smartApps: Map<string, SmartApp>;
  private _installedSmartApps: Map<string, InstalledSmartApp>;

  public getInstalledSmartApp(id: string) {
    return this.getInstalledSmartAppCache().get(id);
  }

  public getInstalledSmartApps(): InstalledSmartApp[] {
    return Array.from(this.getInstalledSmartAppCache().values());
  }

  private getInstalledSmartAppCache(): Map<string, InstalledSmartApp> {
    if (!this._installedSmartApps) {
      this._installedSmartApps = this.loadInstalledSmartApps();
    }
    return this._installedSmartApps;
  }

  private loadInstalledSmartApps(): Map<string, InstalledSmartApp> {
    let newInstalledSmartApps: Map<string, InstalledSmartApp> = new Map<
      string,
      InstalledSmartApp
    >();

    try {
      const isaDirFiles: string[] = fs.readdirSync(
        "userData/installedSmartApps/"
      );
      isaDirFiles.forEach((isaDirFile) => {
        try {
          if (isaDirFile.endsWith(".yaml")) {
            const data = fs.readFileSync(
              `userData/installedSmartApps/${isaDirFile}`,
              "utf-8"
            );
            let parsedFile = YAML.parse(data);
            let installedSmartApp = new InstalledSmartApp();
            installedSmartApp.id = parsedFile.id;
            installedSmartApp.label = parsedFile.label;
            installedSmartApp.smartAppId = parsedFile.smartAppId;
            installedSmartApp.installed = parsedFile.installed;
            installedSmartApp.state = parsedFile.state;
            installedSmartApp.parentInstalledSmartAppId =
              parsedFile.parentInstalledSmartAppId;
            if (parsedFile.settings) {
              installedSmartApp.settings = [];
              parsedFile.settings.forEach((element: any) => {
                let setting: InstalledSmartAppSetting =
                  new InstalledSmartAppSetting();
                setting.id = element.id;
                setting.name = element.name;
                setting.value = element.value;
                setting.type = element.type;
                setting.multiple = element.multiple;
                installedSmartApp.settings.push(setting);
              });
            }
            newInstalledSmartApps.set(installedSmartApp.id, installedSmartApp);
          }
        } catch (err) {
          logger.warn(`Error loading file ${isaDirFile}`);
        }
      });
    } catch (err) {
      logger.warn(
        `Error loading files from userData/installedSmartApps/: ${err.message}`
      );
    }
    return newInstalledSmartApps;
  }

  private saveInstalledSmartApp(isaId: string): boolean {
    let existingIsa: InstalledSmartApp = this.getInstalledSmartApp(isaId);
    try {
      fs.writeFile(
        `userData/installedSmartApps/${isaId}.yaml`,
        YAML.stringify(existingIsa),
        (err: any) => {
          if (err) throw err;
          console.log("installed smart app file has been saved!");
        }
      );
      return true;
    } catch (err) {
      console.log("error when saving installed smart app file", err);
    }

    return false;
  }

  /*
   * SmartApp functions
   */

  public getSmartApps(): SmartApp[] {
    return Array.from(this.getSmartAppCache().values());
  }

  public getSmartApp(id: string) {
    return this.getSmartAppCache().get(id);
  }

  private getSmartAppCache(): Map<string, SmartApp> {
    if (!this._smartApps) {
      this._smartApps = this.loadSmartAppConfig();
    }
    return this._smartApps;
  }

  public updateSmartApp(smartApp: SmartApp): void {
    this.getSmartAppCache().set(smartApp.id, smartApp);
    this.saveSmartApps();
  }

  public createSmartApp(smartApp: SmartApp): void {
    this.getSmartAppCache().set(smartApp.id, smartApp);
    this.saveSmartApps();
  }

  public getSmartAppSources(): Map<string, string> {
    let smartAppSourceList: Map<string, string> = new Map<string, string>();

    // load smartApps from text files in user data directory
    try {
      let dhFilePath: string = "userData/smartApps/";
      const dhDirFiles: string[] = fs.readdirSync(dhFilePath);
      dhDirFiles.forEach((dhDirFile) => {
        if (dhDirFile.endsWith(".js")) {
          let fileName = `${dhFilePath}${dhDirFile}`;
          try {
            smartAppSourceList.set(
              fileName,
              fs.readFileSync(fileName)?.toString()
            );
          } catch (err) {
            logger.warn("error processing user smartApp file", fileName, err);
          }
        }
      });
    } catch (err) {
      console.log("error loading user smartApp directory", err);
    }
    return smartAppSourceList;
  }

  deleteSmartApp(id: string): boolean {
    throw new Error("Method not implemented.");
  }
  getSmartAppSourceCode(id: string): string {
    throw new Error("Method not implemented.");
  }
  updateSmartAppSourceCode(id: string, sourceCode: string): boolean {
    throw new Error("Method not implemented.");
  }
  createSmartAppSourceCode(sourceCode: string, smartApp: SmartApp): string {
    throw new Error("Method not implemented.");
  }

  private saveSmartApps(): void {
    if (this.getSmartAppCache()?.size > 0) {
      try {
        fs.writeFile(
          "userData/config/smartApps.yaml",
          YAML.stringify(this.getSmartAppCache().values()),
          (err: any) => {
            if (err) throw err;
            console.log("smartApp config file has been saved!");
          }
        );
      } catch (err) {
        console.log("error when saving smartApp config file", err);
      }
    }
  }

  // load config file on file system instead of processing through the smartApp files
  private loadSmartAppConfig(): Map<string, SmartApp> {
    let smartAppInfo: Map<string, SmartApp> = new Map<string, SmartApp>();
    try {
      const smartAppsConfigFile = fs.readFileSync(
        "userData/config/smartApps.yaml",
        "utf-8"
      );
      if (smartAppsConfigFile) {
        let parsedFile = YAML.parse(smartAppsConfigFile);
        if (parsedFile && Array.isArray(parsedFile)) {
          parsedFile.forEach((fileDH) => {
            let smartApp: SmartApp = fileDH as SmartApp;
            smartAppInfo.set(smartApp.id, smartApp);
          });
        }
      }
    } catch (err) {
      console.log(err);
    }
    return smartAppInfo;
  }
}
