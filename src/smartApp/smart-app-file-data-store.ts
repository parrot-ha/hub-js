import { SmartApp, SmartAppType } from "./models/smart-app";
import { InstalledSmartApp } from "./models/installed-smart-app";
import { SmartAppDataStore } from "./smart-app-data-store";
import { InstalledSmartAppSetting } from "./models/installed-smart-app-setting";

import YAML from "yaml";
import fs from "fs";
import { randomUUID } from "crypto";

const logger = require("../hub/logger-service")({
  source: "SmartAppFileDataStore",
});

export class SmartAppFileDataStore implements SmartAppDataStore {
  private _smartApps: Map<string, SmartApp>;
  private _installedSmartApps: Map<string, InstalledSmartApp>;
  private _childInstalledSmartApps: Map<string, string[]>;

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
    let isaId: string = randomUUID();
    installedSmartApp.id = isaId;

    this.getInstalledSmartAppCache().set(isaId, installedSmartApp);

    // add to child app map if this is a child app
    if (installedSmartApp.parentInstalledSmartAppId != null) {
      if (
        this.getChildInstalledSmartAppCache().get(
          installedSmartApp.parentInstalledSmartAppId
        ) == null
      ) {
        this.getChildInstalledSmartAppCache().set(
          installedSmartApp.parentInstalledSmartAppId,
          [installedSmartApp.id]
        );
      } else {
        this.getChildInstalledSmartAppCache()
          .get(installedSmartApp.parentInstalledSmartAppId)
          .push(installedSmartApp.id);
      }
    }
    this.saveInstalledSmartApp(isaId);

    return isaId;
  }

  private getChildInstalledSmartAppCache(): Map<string, string[]> {
    if (this._childInstalledSmartApps == null) {
      this.loadInstalledSmartApps();
    }
    return this._childInstalledSmartApps;
  }

  getChildInstalledSmartApps(parentId: string): InstalledSmartApp[] {
    let childApps: InstalledSmartApp[] = [];
    let childAppIds: string[] =
      this.getChildInstalledSmartAppCache().get(parentId);
    if (childAppIds == null || childAppIds.length == 0) {
      return childApps;
    }
    childAppIds.forEach((childAppId) =>
      childApps.push(this.getInstalledSmartApp(childAppId))
    );
    return childApps;
  }

  deleteInstalledSmartApp(id: string): boolean {
    //delete file in installedSmartApps
    try {
      let fileName = `userData/config/installedSmartApps/${id}.yaml`;
      if (fs.existsSync(fileName)) {
        fs.unlinkSync(fileName);
      }
    } catch (err) {
      logger.warn("Unable to remove installed smart app config file for " + id);
      return false;
    }

    this.getInstalledSmartAppCache().delete(id);

    return true;
  }

  getInstalledSmartAppsBySmartApp(smartAppId: string): InstalledSmartApp[] {
    if (smartAppId?.trim()?.length === 0) {
      return [];
    }
    return this.getInstalledSmartApps()?.filter(
      (isa) => isa.smartAppId === smartAppId
    );
  }

  updateInstalledSmartAppState(
    installedSmartAppId: string,
    state: any
  ): boolean {
    let installedSmartApp: InstalledSmartApp =
      this.getInstalledSmartAppCache().get(installedSmartAppId);
    if (installedSmartApp != null) {
      //serialize state to json and back to filter out any bad values
      //https://docs.smartthings.com/en/latest/smartapp-developers-guide/state.html#persistence-model
      if (state != null) {
        installedSmartApp.state = JSON.parse(JSON.stringify(state));
      }
      this.saveInstalledSmartApp(installedSmartApp.id);
    } else {
      throw new Error("Installed Smart App does not exist");
    }

    return true;
  }

  getInstalledSmartAppsByToken(token: string): string[] {
    let smartAppId = this.getTokenToSmartAppMap().get(token);
    if (smartAppId != null) {
      return this.getInstalledSmartApps()
        ?.filter((isa) => smartAppId == isa.smartAppId)
        ?.map((isa) => isa.id);
    }
    return null;
  }

  getOAuthClientIdByToken(token: string): string {
    throw new Error("Method not implemented.");
  }

  public getInstalledSmartApp(id: string) {
    return this.getInstalledSmartAppCache().get(id);
  }

  public getInstalledSmartApps(): InstalledSmartApp[] {
    return Array.from(this.getInstalledSmartAppCache().values());
  }

  private getInstalledSmartAppCache(): Map<string, InstalledSmartApp> {
    if (!this._installedSmartApps) {
      this.loadInstalledSmartApps();
    }
    return this._installedSmartApps;
  }

  private loadInstalledSmartApps(): void {
    let newInstalledSmartApps: Map<string, InstalledSmartApp> = new Map<
      string,
      InstalledSmartApp
    >();
    let newChildAppMap: Map<string, string[]> = new Map<string, string[]>();

    try {
      const isaDirFiles: string[] = fs.readdirSync(
        "userData/config/installedSmartApps/"
      );
      isaDirFiles.forEach((isaDirFile) => {
        try {
          if (isaDirFile.endsWith(".yaml")) {
            const data = fs.readFileSync(
              `userData/config/installedSmartApps/${isaDirFile}`,
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
            let smartApp: SmartApp = this.getSmartApp(
              installedSmartApp.smartAppId
            );
            installedSmartApp.name = smartApp.name;
            installedSmartApp.namespace = smartApp.namespace;
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
            if (installedSmartApp.parentInstalledSmartAppId != null) {
              if (
                newChildAppMap.get(
                  installedSmartApp.parentInstalledSmartAppId
                ) == null
              ) {
                newChildAppMap.set(
                  installedSmartApp.parentInstalledSmartAppId,
                  [installedSmartApp.id]
                );
              } else {
                newChildAppMap
                  .get(installedSmartApp.parentInstalledSmartAppId)
                  .push(installedSmartApp.id);
              }
            }
            newInstalledSmartApps.set(installedSmartApp.id, installedSmartApp);
          }
        } catch (err) {
          logger.warn(`Error loading file ${isaDirFile}`);
        }
      });
    } catch (err) {
      logger.warn(
        `Error loading files from userData/config/installedSmartApps/: ${err.message}`
      );
    }
    this._installedSmartApps = newInstalledSmartApps;
    this._childInstalledSmartApps = newChildAppMap;
  }

  private saveInstalledSmartApp(isaId: string): boolean {
    let existingIsa: InstalledSmartApp = this.getInstalledSmartApp(isaId);
    try {
      let isaYaml = YAML.stringify(existingIsa.toJSON());
      if (isaYaml?.trim().length > 0) {
        fs.writeFile(
          `userData/config/installedSmartApps/${isaId}.yaml`,
          isaYaml,
          (err: any) => {
            if (err) throw err;
          }
        );
        return true;
      } else {
        return false;
      }
    } catch (err) {
      logger.warn("error when saving installed smart app file", err);
      return false;
    }
  }

  private _tokenToSmartAppMap: Map<string, string>;

  private getTokenToSmartAppMap(): Map<string, string> {
    if (this._tokenToSmartAppMap == null) {
      this._tokenToSmartAppMap = this.loadTokenToSmartAppMap();
    }
    return this._tokenToSmartAppMap;
  }

  private loadTokenToSmartAppMap(): Map<string, string> {
    let tokenToSmartAppMap: Map<string, string> = new Map<string, string>();
    for (const smartApp of this.getSmartApps()) {
      if (smartApp.oAuthTokens != null) {
        for (const authToken of smartApp.oAuthTokens) {
          tokenToSmartAppMap.set(authToken.accessToken, smartApp.id);
        }
      }
    }
    return tokenToSmartAppMap;
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
      logger.warn("error loading user smartApp directory", err);
    }
    return smartAppSourceList;
  }

  deleteSmartApp(id: string): boolean {
    let sa: SmartApp = this.getSmartApp(id);
    if (SmartAppType.USER === sa.type) {
      //delete source file
      try {
        if (fs.existsSync(sa.file)) {
          fs.unlinkSync(sa.file);
        }
      } catch (err) {
        logger.warn("Unable to delete smart app " + id);
        return false;
      }
    }

    this.getSmartAppCache().delete(id);
    this.saveSmartApps();
    return true;
  }

  getSmartAppSourceCode(id: string): string {
    let smartApp: SmartApp = this.getSmartApp(id);
    return fs.readFileSync(smartApp.file)?.toString();
  }

  public updateSmartAppSourceCode(id: string, sourceCode: string): boolean {
    let smartApp: SmartApp = this.getSmartApp(id);
    if (smartApp?.type == SmartAppType.USER) {
      fs.writeFile(smartApp.file, sourceCode, (err: any) => {
        if (err) throw err;
        return true;
      });
    }

    return false;
  }

  createSmartAppSourceCode(sourceCode: string, smartApp: SmartApp): string {
    let fileName: string = `userData/smartApps/${smartApp.id}.js`;
    smartApp.file = fileName;
    try {
      fs.writeFile(fileName, sourceCode, (err: any) => {
        if (err) throw err;
        // save smart app definition
        this.createSmartApp(smartApp);
      });
      return smartApp.id;
    } catch (err) {
      logger.warn("error when saving smartApp file", err);
      return null;
    }
  }

  private saveSmartApps(): void {
    if (this.getSmartAppCache()?.size > 0) {
      try {
        fs.writeFile(
          "userData/config/smartApps.yaml",
          YAML.stringify(this.getSmartAppCache().values()),
          (err: any) => {
            if (err) throw err;
            logger.debug("smartApp config file has been saved!");
          }
        );
      } catch (err) {
        logger.warn("error when saving smartApp config file", err);
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
            let smartApp: SmartApp = SmartApp.buildFromObject(fileDH);
            smartAppInfo.set(smartApp.id, smartApp);
          });
        }
      }
    } catch (err) {
      logger.warn(err);
    }
    return smartAppInfo;
  }
}
