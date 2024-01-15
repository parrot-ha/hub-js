import * as crypto from "crypto";
import { InstalledSmartApp } from "./models/installed-smart-app";
import { InstalledSmartAppSetting } from "./models/installed-smart-app-setting";
import { SmartApp, SmartAppType } from "./models/smart-app";
import { SmartAppDataStore } from "./smart-app-data-store";
import { SmartAppInUseError } from "./errors/smart-app-in-use-error";
import { difference } from "../utils/object-utils";
import { EntityLogger } from "../entity/entity-logger-service";
import { SmartAppDelegate } from "./smart-app-delegate";
const logger = require("../hub/logger-service")({ source: "SmartAppService" });

const fs = require("fs");
const vm = require("vm");

export class SmartAppService {
  private _smartAppDataStore: SmartAppDataStore;

  public constructor(smartAppDataStore: SmartAppDataStore) {
    this._smartAppDataStore = smartAppDataStore;
  }

  public initialize(): void {
    this.reprocessSmartApps();
    //TODO: handle extensions
    // if (extensionService != null) {
    //     extensionService.registerStateListener(this);
    // }
  }

  public shutdown(): void {
    logger.trace("shutting down device service");
    console.log("shutting down device service");
    //TODO: handle extensions
    // if (extensionService != null) {
    //     extensionService.unregisterStateListener(this);
    // }
  }

  public getSmartApps(): SmartApp[] {
    return this._smartAppDataStore.getSmartApps();
  }

  public getInstalledSmartApps(): InstalledSmartApp[] {
    return this._smartAppDataStore.getInstalledSmartApps();
  }

  public getInstalledSmartApp(id: string): InstalledSmartApp {
    return this._smartAppDataStore.getInstalledSmartApp(id);
  }

  public getInstalledSmartAppsBySmartApp(
    smartAppId: string
  ): InstalledSmartApp[] {
    return this._smartAppDataStore.getInstalledSmartAppsBySmartApp(smartAppId);
  }

  public getSmartApp(id: string): SmartApp {
    return this._smartAppDataStore.getSmartApp(id);
  }

  public deleteInstalledSmartApp(installedSmartAppId: string): boolean {
    return this._smartAppDataStore.deleteInstalledSmartApp(installedSmartAppId);
  }

  public addInstalledSmartApp(smartAppId: string): string {
    let sa: SmartApp = this.getSmartApp(smartAppId);

    let isa: InstalledSmartApp = new InstalledSmartApp();
    isa.label = sa.name;
    isa.smartAppId = sa.id;
    return this._smartAppDataStore.createInstalledSmartApp(isa);
  }

  public addChildInstalledSmartApp(
    parentAppId: string,
    appName: string,
    namespace: string
  ): string {
    let childSmartApp: SmartApp = this.getSmartAppByNameAndNamespace(
      appName,
      namespace
    );
    let parentInstalledSmartApp: InstalledSmartApp =
      this.getInstalledSmartApp(parentAppId);
    if (parentInstalledSmartApp == null) {
      throw new Error("Parent App Id not found: " + parentAppId);
    }
    let parentSmartApp: SmartApp = this.getSmartApp(
      parentInstalledSmartApp.smartAppId
    );
    if (
      childSmartApp.parent != null &&
      childSmartApp.parent ===
        parentSmartApp.namespace + ":" + parentSmartApp.name
    ) {
      let isa: InstalledSmartApp = new InstalledSmartApp();
      isa.label = childSmartApp.name;
      isa.smartAppId = childSmartApp.id;
      isa.parentInstalledSmartAppId = parentAppId;
      return this._smartAppDataStore.createInstalledSmartApp(isa);
    } else {
      throw new Error("Specified app is not a child of the parent app.");
    }
  }

  public getSmartAppByNameAndNamespace(
    name: string,
    namespace: string
  ): SmartApp {
    for (let smartApp of this.getSmartApps()) {
      if (smartApp.name === name && smartApp.namespace === namespace) {
        return smartApp;
      }
    }
    return null;
  }

  public getInstalledSmartAppsByToken(token: string): string[] {
    return this._smartAppDataStore.getInstalledSmartAppsByToken(token);
  }

  public updateInstalledSmartApp(
    installedSmartApp: InstalledSmartApp
  ): boolean {
    return this._smartAppDataStore.updateInstalledSmartApp(installedSmartApp);
  }

  public updateInstalledSmartAppState(
    id: string,
    originalState: any,
    updatedState: any
  ) {
    let changes = difference(updatedState, originalState);
    let installedSmartApp: InstalledSmartApp = this.getInstalledSmartApp(id);
    let existingState = installedSmartApp.state;
    if (existingState) {
      changes.removed.forEach((key) => delete existingState[key]);
      Object.keys(changes.updated).forEach(
        (key) => (existingState[key] = changes.updated[key])
      );
      Object.keys(changes.added).forEach(
        (key) => (existingState[key] = changes.added[key])
      );
      this._smartAppDataStore.updateInstalledSmartAppState(id, existingState);
    } else {
      this._smartAppDataStore.updateInstalledSmartAppState(id, updatedState);
    }
  }

  public updateSmartApp(smartApp: SmartApp): void {
    this._smartAppDataStore.updateSmartApp(smartApp);
  }

  public getSmartAppSourceCode(id: string): string {
    return this._smartAppDataStore.getSmartAppSourceCode(id);
  }

  public removeSmartApp(id: string): boolean {
    let smartAppsInUse: InstalledSmartApp[] =
      this.getInstalledSmartAppsBySmartApp(id);
    if (smartAppsInUse?.length > 0) {
      throw new SmartAppInUseError("Smart App in use", smartAppsInUse);
    } else {
      return this._smartAppDataStore.deleteSmartApp(id);
    }
  }

  public addSmartAppSourceCode(sourceCode: string): string {
    let smartApp = this.processSmartAppSource(
      "newSmartApp",
      sourceCode,
      SmartAppType.USER
    );
    if (smartApp == null) {
      throw new Error("No definition found.");
    }
    let saId: string = this._smartAppDataStore.createSmartAppSourceCode(
      sourceCode,
      smartApp
    );
    return saId;
  }

  public updateSmartAppSourceCode(id: string, sourceCode: string): boolean {
    let existingSmartApp: SmartApp = this.getSmartApp(id);
    if (existingSmartApp) {
      // compile source code so that any compile errors get thrown and we get any new definition changes
      let updatedSmartApp: SmartApp = this.processSmartAppSource(
        existingSmartApp.file,
        sourceCode,
        existingSmartApp.type
      );
      this.updateSmartAppIfChanged(existingSmartApp, updatedSmartApp);
      return this._smartAppDataStore.updateSmartAppSourceCode(id, sourceCode);
    }
    throw new Error("Smart App not found.");
  }

  private updateSmartAppIfChanged(
    oldSmartApp: SmartApp,
    newSmartApp: SmartApp
  ): void {
    // if any changes are made to the new app excluding client id and client secret, then update.
    // or if there are changes to the client id and client secret and the new app does not have it set to null
    // this is so that it will not clear out client id and client secret that have been set by the user at runtime instead of
    // being defined in the smart app definition.
    if (
      !newSmartApp.equalsIgnoreId(oldSmartApp, false) ||
      (!newSmartApp.equalsIgnoreId(oldSmartApp, true) &&
        newSmartApp.oAuthClientId != null &&
        newSmartApp.oAuthClientSecret != null)
    ) {
      logger.debug("Changes for file " + newSmartApp.file);
      newSmartApp.id = oldSmartApp.id;
      newSmartApp.oAuthTokens = oldSmartApp.oAuthTokens;
      this._smartAppDataStore.updateSmartApp(newSmartApp);
    } else {
      // only difference is the id,, so no changes
      logger.debug("No changes for file " + newSmartApp.file);
    }
  }

  public updateInstalledSmartAppSettings(id: string, settingsMap: any): void {
    let isa: InstalledSmartApp = this.getInstalledSmartApp(id);
    for (let key in settingsMap) {
      let setting = settingsMap[key];
      let isaSetting: InstalledSmartAppSetting = isa.getSettingByName(key);
      if (isaSetting != null) {
        // update existing setting
        isaSetting.processValueTypeAndMultiple(
          setting.value,
          setting.type,
          setting.multiple
        );
      } else {
        // create new setting
        isaSetting = new InstalledSmartAppSetting();
        isaSetting.id = crypto.randomUUID();
        isaSetting.name = key;
        isaSetting.processValueTypeAndMultiple(
          setting.value,
          setting.type,
          setting.multiple
        );
        isa.addSetting(isaSetting);
      }
    }
    this._smartAppDataStore.updateInstalledSmartApp(isa);
  }

  public reprocessSmartApps(): void {
    //TODO: run this process in the background, allows quicker start up of system at the
    // expense of system starting up with possibly old smart app definition, however
    // this should be quickly rectified once system is fully running

    let smartApps: SmartApp[] = this._smartAppDataStore.getSmartApps();
    let newSmartAppInfoMap: Map<string, SmartApp> = this.processSmartAppInfo();

    if (smartApps != null && newSmartAppInfoMap != null) {
      // check each device handler info against what is in the config file.
      this.compareNewAndExistingSmartApps(
        smartApps,
        Array.from(newSmartAppInfoMap.values())
      );
    }
  }

  private compareNewAndExistingSmartApps(
    existingSmartApps: SmartApp[],
    newSmartApps: SmartApp[]
  ): void {
    // check each smart app info against what is in the config file.
    for (let newSmartApp of newSmartApps) {
      let fileName: string = newSmartApp.file;

      let existingSmartApp = existingSmartApps?.filter(
        (esa) => esa.file === fileName
      );

      if (
        existingSmartApp != null &&
        Array.isArray(existingSmartApp) &&
        existingSmartApp.length > 0
      ) {
        if (existingSmartApp.length > 1) {
          logger.warn("Found more than one matching Smart App!");
        } else if (
          !newSmartApp.equalsIgnoreId(existingSmartApp[0], false) ||
          (!newSmartApp.equalsIgnoreId(existingSmartApp[0], true) &&
            newSmartApp.oAuthClientId != null &&
            newSmartApp.oAuthClientSecret != null)
        ) {
          logger.debug("Changes for file " + newSmartApp.file);
          newSmartApp.id = existingSmartApp[0].id;
          newSmartApp.oAuthTokens = existingSmartApp[0].oAuthTokens;

          this._smartAppDataStore.updateSmartApp(newSmartApp);
        } else {
          // only difference is the id,, so no changes
          logger.debug("No changes for file " + newSmartApp.file);
        }
      } else {
        // we have a new smart app.
        this._smartAppDataStore.createSmartApp(newSmartApp);
      }
    }
  }

  private processSmartAppInfo(): Map<string, SmartApp> {
    // we need to process smart apps
    let smartAppInfo: Map<string, SmartApp> = new Map<string, SmartApp>();

    // load built in smart apps
    const saDirFiles: string[] = fs.readdirSync("smartApps/");
    saDirFiles.forEach((saDirFile) => {
      if (saDirFile.endsWith(".js")) {
        let fileName = `smartApps/${saDirFile}`;
        try {
          const sourceCode = fs.readFileSync(fileName)?.toString();
          let smartApp = this.processSmartAppSource(
            fileName,
            sourceCode,
            SmartAppType.SYSTEM
          );
          smartAppInfo.set(smartApp.id, smartApp);
        } catch (err) {
          logger.warn("error processing system smart app files" + err.message);
        }
      }
    });

    // load smart apps from data store
    let saSources: Map<string, string> =
      this._smartAppDataStore.getSmartAppSources();
    saSources?.forEach((sourceCode: string, fileName: string) => {
      let smartApp = this.processSmartAppSource(
        fileName,
        sourceCode,
        SmartAppType.USER
      );
      smartAppInfo.set(smartApp.id, smartApp);
    });

    // TODO: load smart app sources from extensions

    return smartAppInfo;
  }

  public getSmartAppPreferencesByInstalledSmartApp(
    installedSmartAppId: string
  ) {
    let installedSmartApp: InstalledSmartApp =
      this.getInstalledSmartApp(installedSmartAppId);

    let sourceCode = this.getSmartAppSourceCode(installedSmartApp?.smartAppId);

    return this.getSmartAppMetadata(
      sourceCode,
      `${installedSmartApp}.js`,
      false
    )?.preferences;
  }

  private getSmartAppMetadata(
    sourceCode: string,
    fileName: string,
    includeDefinition: boolean,
    includePreferences: boolean = true,
    includeMappings: boolean = false
  ) {
    let smartAppDelegate: SmartAppDelegate = new SmartAppDelegate(
      null,
      null,
      null,
      this,
      null,
      includeDefinition,
      includePreferences,
      includeMappings
    );
    let sandbox = this.buildMetadataContext(smartAppDelegate);

    try {
      vm.createContext(sandbox);
      vm.runInContext(sourceCode, sandbox, {
        filename: fileName,
      });
    } catch (err) {
      if (err.stack.includes("SyntaxError:")) {
        // problem with the code

        let errStack = err.stack.substring(
          0,
          err.stack.indexOf("at SmartAppService.processSmartAppSource")
        );
        //TODO: better way to handle this?
        errStack = errStack.substring(0, errStack.lastIndexOf("at "));
        errStack = errStack.substring(0, errStack.lastIndexOf("at "));
        errStack = errStack.substring(0, errStack.lastIndexOf("at "));
        err.message = errStack.trim();
      }
      throw err;
    }

    return smartAppDelegate.metadataValue;
  }

  private processSmartAppSource(
    fileName: string,
    sourceCode: string,
    type: SmartAppType = SmartAppType.USER
  ): SmartApp {
    let metadataValue = this.getSmartAppMetadata(sourceCode, fileName, true);

    let smartApp = new SmartApp();
    if (metadataValue?.definition) {
      let definition = metadataValue.definition;
      if (definition.smartAppId) {
        smartApp.id = definition.smartAppId;
      } else {
        smartApp.id = crypto.randomUUID();
      }

      smartApp.name = definition.name;
      smartApp.namespace = definition.namespace;
      smartApp.author = definition.author;
      smartApp.description = definition.description;
      smartApp.category = definition.category;
      smartApp.iconUrl = definition.iconUrl;
      smartApp.iconX2Url = definition.iconX2Url;
      smartApp.type = type;
      smartApp.file = fileName;
      return smartApp;
    } else {
      throw new Error(`No smart app definition found for file ${fileName}`);
    }
  }

  private buildMetadataContext(delegate: SmartAppDelegate): any {
    let sandbox: any = {};
    sandbox["log"] = new EntityLogger("SMARTAPP", "NONE", "New Smart App");
    delegate.sandboxMethods.forEach((sandboxMethod: string) => {
      sandbox[sandboxMethod] = (delegate as any)[sandboxMethod].bind(delegate);
    });

    return sandbox;
  }
}
