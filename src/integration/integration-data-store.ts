import { Protocol } from "../device/models/protocol";
import { IntegrationConfiguration } from "./models/integration-configuration";
import { IntegrationSetting } from "./models/integration-setting";
import { randomUUID } from "crypto";
import YAML from "yaml";
import fs from "fs";

export interface IntegrationDataStore {
  getIntegrationSettings(integrationId: string): IntegrationSetting[];

  getIntegrationSettingValue(
    integrationId: string,
    configurationId: string
  ): string;

  updateIntegrationSettingValue(
    integrationId: string,
    configurationKey: string,
    configurationValue: any,
    type: string,
    multiple: boolean
  ): void;

  addIntegrationConfiguration(
    protocol: Protocol,
    integrationTypeId: string,
    settings: IntegrationSetting[]
  ): string;

  removeIntegrationConfiguration(integrationId: string): boolean;

  updateIntegrationConfiguration(
    integrationConfiguration: IntegrationConfiguration
  ): void;

  getIntegrationById(id: string): IntegrationConfiguration;
  
  getIntegrations(): IntegrationConfiguration[];
}
