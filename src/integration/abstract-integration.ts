import EventEmitter from "node:events";
import { IntegrationEvent } from "./integration-events";
import { IntegrationSetting } from "./models/integration-setting";
import { IntegrationService } from "./integration-service";
import { isBlank } from "../utils/string-utils";

export abstract class AbstractIntegration extends EventEmitter {
  private _id: string = null;

  public get id(): string {
    return this._id;
  }
  public set id(value: string) {
    this._id = value;
  }

  private _integrationService: IntegrationService;

  public set integrationService(integrationService: IntegrationService) {
    this._integrationService = integrationService;
  }

  public abstract start(): void;
  public abstract stop(): Promise<any>;

  public sendEvent(integrationEvent: IntegrationEvent): void {
    integrationEvent.integrationId = this.id;
    this.emit("event", integrationEvent);
  }

  public get label(): string {
    let label: string =
      this._integrationService.getIntegrationConfigurationById(this.id).label;
    return label || this.name;
  }

  public abstract get name(): string;

  public abstract get description(): string;

  public abstract get displayInformation(): any;

  // override this method if you want to provide a default configuration
  public getDefaultSettings(): IntegrationSetting[] {
    return [];
  }

  // override this method if integration provides options to configure
  // It should match what comes from a device preferences
  public getPreferencesLayout(): any {
    return {};
  }

  // this function will inform the integration of configuration changes
  public abstract settingValueChanged(keys: string[]): void;

  // override this method if you want to provide a custom layout for the integration
  public getPageLayout(): any[] {
    return [];
  }

  // override this method if you want to provide data for the custom layout for the integration
  public getPageData(): any {
    return {};
  }

  public getSettingAsString(key: string, defaultValue: string = null): string {
    let value: string =
      this._integrationService.getIntegrationConfigurationValue(this._id, key);

    if (defaultValue != null && isBlank(value)) {
      return defaultValue;
    } else {
      return value;
    }
  }

  public updateSetting(
    key: string,
    value: string,
    type: string,
    multiple: boolean
  ): void {
    this._integrationService.updateIntegrationSettingValue(
      this._id,
      key,
      value,
      type,
      multiple
    );
  }

  public getSettingAsInteger(key: string, defaultValue: number = null): number {
    let settingInt: number = null;
    try {
      settingInt = parseInt(this.getSettingAsString(key));
      if (isNaN(settingInt)) settingInt = defaultValue;
    } catch (err) {
      if (defaultValue != null) {
        settingInt = defaultValue;
      }
    }

    return settingInt;
  }

  public getSettings(): IntegrationSetting[] {
    return this._integrationService.getIntegrationSettings(this.id);
  }

  public processButtonAction(action: string): any {
    return null;
  }
}

export enum IntegrationType {
  CLOUD,
  DEVICE, // generic device integration
  LAN,
  ZIGBEE,
  ZWAVE,
  MATTER,
}
