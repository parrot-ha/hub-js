import * as crypto from "crypto";
import { InstalledSmartApp } from "../models/installed-smart-app";
import { SmartApp } from "../models/smart-app";
import YAML from "yaml";
import { InstalledSmartAppSetting } from "../models/installed-smart-app-setting";

const fs = require("fs");
const { NodeVM } = require("vm2");
const path = require("path");

export class SmartAppService {
  private smartApps: Map<string, SmartApp> = new Map<string, SmartApp>();
  private installedSmartApps: Map<string, InstalledSmartApp> = new Map<
    string,
    InstalledSmartApp
  >();

  public constructor() {
    this.processSmartApps();
    this.processInstalledSmartApps();
  }
  getInstalledSmartApps(): InstalledSmartApp[] {
    throw new Error("Method not implemented.");
  }
  getSmartApps(): SmartApp[] {
    throw new Error("Method not implemented.");
  }

  getInstalledSmartApp(id: string) {
    return this.installedSmartApps.get(id);
  }

  getSmartApp(id: string) {
    return this.smartApps.get(id);
  }

  private processSmartApps() {
    try {
      // list smart apps in directories
      const saDirFiles: string[] = fs.readdirSync("smartApps/");
      saDirFiles.forEach((saDirFile) => {
        if (saDirFile.endsWith(".js")) {
          let fileName = `smartApps/${saDirFile}`;
          const data = fs.readFileSync(fileName);
          const testCodeMetadata =
            data.toString() +
            "\nmodule.exports = { definition, preferences, smartAppId }";
          const mdVm = new NodeVM({
            require: {
              external: true,
            },
            sandbox: {
              settings: {},
            },
          });
          const userCodeMetaData = mdVm.run(testCodeMetadata, {
            filename: "smartApp.js",
            require: (moduleName: string) => {
              return path.resolve(__dirname, moduleName);
            },
          });

          let smartApp = new SmartApp();
          if (userCodeMetaData.smartAppId != null) {
            smartApp.id = userCodeMetaData.smartAppId;
          } else {
            smartApp.id = crypto.randomUUID();
          }
          smartApp.name = userCodeMetaData.definition.name;
          smartApp.namespace = userCodeMetaData.definition.namespace;
          smartApp.author = userCodeMetaData.definition.author;
          smartApp.description = userCodeMetaData.definition.description;
          //TODO: get rest of values
          smartApp.file = fileName;
          this.smartApps.set(smartApp.id, smartApp);
        }
      });
    } catch (err) {
      console.log(err);
    }
  }

  // load installed smart apps from file system
  private processInstalledSmartApps() {
    try {
      const isaDirFiles: string[] = fs.readdirSync("installedSmartApps/");
      isaDirFiles.forEach((isaDirFile) => {
        if (isaDirFile.endsWith(".yml")) {
          const data = fs.readFileSync(
            `installedSmartApps/${isaDirFile}`,
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
          this.installedSmartApps.set(installedSmartApp.id, installedSmartApp);
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
        }
      });
    } catch (err) {
      console.log(err);
    }
  }

  private saveInstalledSmartApps() {
    fs.mkdirSync("installedSmartApps/");
    this.getInstalledSmartApps().forEach((isa: InstalledSmartApp) => {
      fs.writeFile(
        `installedSmartApps/${isa.id}.yml`,
        YAML.stringify(isa),
        (err: any) => {
          if (err) throw err;
          console.log(`The installed smart app file ${isa.id} has been saved!`);
        }
      );
    });
  }
}
