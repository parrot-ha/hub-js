import { IntegrationSetting } from "./models/integration-setting";

export interface IntegrationConfigurationService {
  getLabel(integrationId: string): string;

  getConfiguration(integrationId: string): IntegrationSetting[];

  getConfigurationValue(
    integrationId: string,
    configurationKey: string
  ): string;

  updateConfigurationValue(
    integrationId: string,
    configurationKey: string,
    configurationValue: any,
    type: string,
    multiple: boolean
  ): void;
}
