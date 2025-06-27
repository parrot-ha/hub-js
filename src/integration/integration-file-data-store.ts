import { Protocol } from "../device/models/protocol";
import { IntegrationConfiguration } from "./models/integration-configuration";
import { IntegrationSetting } from "./models/integration-setting";
import { randomUUID } from "crypto";
import { IntegrationDataStore } from "./integration-data-store";
import { createUserDirectory, deleteUserFile, readUserDir, saveUserYamlFile, parseUserYamlFile } from "../utils/file-utils";
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
    configurationId: string,
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
    multiple: boolean,
  ): void {
    let integrationConfiguration: IntegrationConfiguration =
      this.getIntegrationById(integrationId);
    if (integrationConfiguration != null) {
      let setting: IntegrationSetting =
        integrationConfiguration.getSettingByName(configurationKey);
      if (!setting) {
        setting = new IntegrationSetting();
        setting.id = randomUUID();
        setting.name = configurationKey;
        setting.processValueTypeAndMultiple(configurationValue, type, multiple);
        integrationConfiguration.addSetting(setting);
      } else {
        setting.processValueTypeAndMultiple(configurationValue, type, multiple);
      }
      this.saveIntegrationConfiguration(integrationConfiguration);
    }
  }

  public addIntegrationConfiguration(
    protocol: Protocol,
    integrationTypeId: string,
    settings: IntegrationSetting[],
  ): string {
    let integrationConfiguration: IntegrationConfiguration =
      new IntegrationConfiguration();
    integrationConfiguration.id = randomUUID();
    integrationConfiguration.protocol = protocol;
    integrationConfiguration.integrationTypeId = integrationTypeId;
    integrationConfiguration.settings = settings;

    this.getIntegrationMap().set(
      integrationConfiguration.id,
      integrationConfiguration,
    );
    this.saveIntegrationConfiguration(integrationConfiguration);

    return integrationConfiguration.id;
  }

  public removeIntegrationConfiguration(integrationId: string): boolean {
    //delete file in integrations
    try {
      deleteUserFile(`config/integrations/${integrationId}.yaml`);
    } catch (err) {
      logger.warn(
        "Unable to delete integration configuration " + integrationId,
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
    integrationConfiguration: IntegrationConfiguration,
  ): void {
    if (this.getIntegrationMap() != null) {
      this.getIntegrationMap().set(
        integrationConfiguration.id,
        integrationConfiguration,
      );
      this.saveIntegrationConfiguration(integrationConfiguration);
    }
  }

  private saveIntegrationConfiguration(
    integrationConfiguration: IntegrationConfiguration,
  ): void {
    try {
      saveUserYamlFile(
        `config/integrations/${integrationConfiguration.id}.yaml`,
        integrationConfiguration.toJSON(),
      );
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
      createUserDirectory("config/integrations/");

      const intDirFiles: string[] = readUserDir("config/integrations/")
      intDirFiles.forEach((intDirFile) => {
        try {
          if (intDirFile.endsWith(".yaml")) {
            let parsedFile = parseUserYamlFile("config/integrations", intDirFile);
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
        `Error loading files from config/integrations/: ${err.message}`,
      );
    }

    this._integrations = integrationsTemp;
  }
}
