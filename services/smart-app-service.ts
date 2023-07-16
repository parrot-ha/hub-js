import * as crypto from "crypto";
import { InstalledSmartApp } from "../models/installed-smart-app";
import { SmartApp, SmartAppType } from "../models/smart-app";
import YAML from "yaml";
import { InstalledSmartAppSetting } from "../models/installed-smart-app-setting";
import { SmartAppMetadataDelegate } from "../delegates/smart-app-metadata-delegate";
import { Logger } from "./logger-service";
import { SmartAppDataStore } from "../data-store/smart-app-data-store";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

export class SmartAppService {
  private smartApps: Map<string, SmartApp> = new Map<string, SmartApp>();
  private installedSmartApps: Map<string, InstalledSmartApp> = new Map<
    string,
    InstalledSmartApp
  >();

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

  public getSmartApp(id: string): SmartApp {
    return this._smartAppDataStore.getSmartApp(id);
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
    for (let newSAInfo of newSmartApps) {
      let fileName: string = newSAInfo.file;

      let foundExistingSA: boolean = false;
      for (let oldSAInfo of existingSmartApps) {
        if (fileName === oldSAInfo.file) {
          foundExistingSA = true;
          // the file name matches, let see if any of the values have changed.
          //TODO: this check is only if the file name stays the same, add another check in case all the contents stay the same, but the file name changed.

          // if any changes are made to the new app excluding client id and client secret, then update.
          // or if there are changes to the client id and client secret and the new app does not have it set to null
          // this is so that it will not clear out client id and client secret that have been set by the user at runtime instead of
          // being defined in the automation app definition.
          if (
            !newSAInfo.equalsIgnoreId(oldSAInfo, false) ||
            (!newSAInfo.equalsIgnoreId(oldSAInfo, true) &&
              newSAInfo.oAuthClientId != null &&
              newSAInfo.oAuthClientSecret != null)
          ) {
            console.log("Changes for file " + newSAInfo.file);
            newSAInfo.id = oldSAInfo.id;
            //newSAInfo.oAuthTokens = oldSAInfo.oAuthTokens;

            this._smartAppDataStore.updateSmartApp(newSAInfo);
          } else {
            // only difference is the id,, so no changes
            console.log("No changes for file " + newSAInfo.file);
          }
        }
      }
      if (!foundExistingSA) {
        // we have a new smart app.
        this._smartAppDataStore.createSmartApp(newSAInfo);
      }
    }
  }

  private saveInstalledSmartApps() {
    this.getInstalledSmartApps().forEach((isa: InstalledSmartApp) => {
      fs.writeFile(
        `userData/installedSmartApps/${isa.id}.yaml`,
        YAML.stringify(isa),
        (err: any) => {
          if (err) throw err;
          console.log(`The installed smart app file ${isa.id} has been saved!`);
        }
      );
    });
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
          console.log("error processing system smart app files", err);
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

  private processSmartAppSource(
    fileName: string,
    sourceCode: string,
    type: SmartAppType = SmartAppType.USER
  ): SmartApp {
    let smartAppMetadataDelegate: SmartAppMetadataDelegate =
      new SmartAppMetadataDelegate();
    let sandbox = this.buildMetadataContext(smartAppMetadataDelegate);

    vm.createContext(sandbox);
    vm.runInContext(sourceCode, sandbox, { filename: fileName });

    let smartApp = new SmartApp();
    if (smartAppMetadataDelegate.metadataValue?.definition) {
      let definition = smartAppMetadataDelegate.metadataValue.definition;
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

  private buildMetadataContext(
    deviceMetadataDelegate: SmartAppMetadataDelegate
  ): any {
    let sandbox: any = {};
    sandbox["log"] = Logger;
    deviceMetadataDelegate.sandboxMethods.forEach((sandboxMethod: string) => {
      sandbox[sandboxMethod] = (deviceMetadataDelegate as any)[
        sandboxMethod
      ].bind(deviceMetadataDelegate);
    });

    return sandbox;
  }
}
