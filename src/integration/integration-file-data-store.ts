import { Protocol } from "../device/models/protocol";
import { IntegrationConfiguration } from "./models/integration-configuration";
import { IntegrationSetting } from "./models/integration-setting";
import { randomUUID } from "crypto";
import YAML from "yaml";
import fs from "fs";
import { IntegrationDataStore } from "./integration-data-store";
const logger = require("../hub/logger-service")({
  source: "DeviceFileDataStore",
});

export class IntegrationFileDataStore implements IntegrationDataStore {
  private _integrations: Map<string, IntegrationConfiguration>;

  public getIntegrationSettings(integrationId: string): IntegrationSetting[] {
    let integrationConfiguration: IntegrationConfiguration =
      this.getIntegrationById(integrationId);
    if (integrationConfiguration != null) {
      return integrationConfiguration.settings;
    } else {
      return null;
    }
  }

  public getIntegrationSettingValue(
    integrationId: string,
    configurationId: string
  ): string {
    let integrationConfiguration: IntegrationConfiguration =
      this.getIntegrationById(integrationId);
    if (integrationConfiguration != null) {
      let setting: IntegrationSetting =
        integrationConfiguration.getSettingByName(configurationId);
      if (setting != null) {
        return setting.value;
      }
    }
    return null;
  }

  public updateIntegrationSettingValue(
    integrationId: string,
    configurationKey: string,
    configurationValue: any,
    type: string,
    multiple: boolean
  ): void {
    let integrationConfiguration: IntegrationConfiguration =
      this.getIntegrationById(integrationId);
    if (integrationConfiguration != null) {
      let setting: IntegrationSetting =
        integrationConfiguration.getSettingByName(configurationKey);
      if (setting != null) {
        if (configurationValue != null) {
          setting.value = configurationValue.toString();
        } else {
          setting.value = null;
        }
        setting.type = type;
        setting.multiple = multiple;
        this.saveIntegrationConfiguration(integrationConfiguration);
      }
    }
  }

  public addIntegrationConfiguration(
    protocol: Protocol,
    integrationTypeId: string,
    settings: IntegrationSetting[]
  ): string {
    let integrationConfiguration: IntegrationConfiguration =
      new IntegrationConfiguration();
    integrationConfiguration.id = randomUUID();
    integrationConfiguration.protocol = protocol;
    integrationConfiguration.integrationTypeId = integrationTypeId;
    integrationConfiguration.settings = settings;

    this.getIntegrationMap().set(
      integrationConfiguration.id,
      integrationConfiguration
    );
    this.saveIntegrationConfiguration(integrationConfiguration);

    return integrationConfiguration.id;
  }

  public removeIntegrationConfiguration(integrationId: string): boolean {
    //delete file in integrations
    try {
      let fileName: string = `userData/config/integrations/${integrationId}.yaml`;
      if (fs.existsSync(fileName)) {
        fs.unlinkSync(fileName);
      }
    } catch (err) {
      logger.warn(
        "Unable to delete integration configuration " + integrationId
      );
      return false;
    }
    try {
      this.getIntegrationMap().delete(integrationId);
    } catch (err) {
      logger.warn(err);
    }

    return true;
  }

  public updateIntegrationConfiguration(
    integrationConfiguration: IntegrationConfiguration
  ): void {
    if (this.getIntegrationMap() != null) {
      this.getIntegrationMap().set(
        integrationConfiguration.id,
        integrationConfiguration
      );
      this.saveIntegrationConfiguration(integrationConfiguration);
    }
  }

  private saveIntegrationConfiguration(
    integrationConfiguration: IntegrationConfiguration
  ): void {
    try {
      let integrationConfigurationYaml = YAML.stringify(
        integrationConfiguration.toJSON()
      );
      if (integrationConfigurationYaml?.trim().length > 0) {
        fs.writeFile(
          `userData/config/integrations/${integrationConfiguration.id}.yaml`,
          integrationConfigurationYaml,
          (err: any) => {
            if (err) throw err;
          }
        );
      }
    } catch (err) {
      console.log(err);
    }
  }

  public getIntegrationById(id: string): IntegrationConfiguration {
    return this.getIntegrationMap().get(id);
  }

  public getIntegrations(): IntegrationConfiguration[] {
    return Array.from(this.getIntegrationMap().values());
  }

  private getIntegrationMap(): Map<string, IntegrationConfiguration> {
    if (this._integrations == null) {
      this.loadIntegrations();
    }
    return this._integrations;
  }

  private loadIntegrations(): void {
    if (this._integrations != null) {
      return;
    }
    let integrationsTemp: Map<string, IntegrationConfiguration> = new Map<
      string,
      IntegrationConfiguration
    >();

    try {
      if (!fs.existsSync("userData/config/integrations/")) {
        fs.mkdirSync("userData/config/integrations/");
      }

      const intDirFiles: string[] = fs.readdirSync(
        "userData/config/integrations/"
      );
      intDirFiles.forEach((intDirFile) => {
        try {
          if (intDirFile.endsWith(".yaml")) {
            const data = fs.readFileSync(
              `userData/config/integrations/${intDirFile}`,
              "utf-8"
            );
            let parsedFile = YAML.parse(data);
            let integrationConfig: IntegrationConfiguration =
              IntegrationConfiguration.fromJSON(parsedFile);
            integrationsTemp.set(integrationConfig.id, integrationConfig);
          }
        } catch (err) {
          logger.warn(`Error loading file ${intDirFile}`);
        }
      });
    } catch (err) {
      logger.warn(
        `Error loading files from userData/config/integrations/: ${err.message}`
      );
    }

    //    File integrationConfigDir = new File("config/integrations/");

    //   if (integrationConfigDir.exists() && integrationConfigDir.isDirectory()) {
    //       File[] integrationConfigFiles = integrationConfigDir.listFiles(pathname -> pathname.isFile() &&
    //               pathname.getName().endsWith(".yaml"));
    //       if (integrationConfigFiles != null && integrationConfigFiles.length > 0) {
    //           Yaml yaml = new Yaml();
    //           yaml.setBeanAccess(BeanAccess.FIELD);
    //           for (File f : integrationConfigFiles) {
    //               try {
    //                   IntegrationConfiguration integration = yaml.load(new FileInputStream(f));
    //                   integrationsTemp.put(integration.getId(), integration);
    //               } catch (Exception e) {
    //                   e.printStackTrace();
    //               }
    //           }
    //       }
    //   }
    this._integrations = integrationsTemp;
  }

  // private void createDirectory(String directory) {
  //   File directoryFile = new File(directory);
  //   if (!directoryFile.exists()) {
  //       directoryFile.mkdir();
  //   }
  // }
}
