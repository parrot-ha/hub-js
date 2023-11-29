import { Protocol } from "../../device/models/protocol";
import { IntegrationSetting } from "./integration-setting";

export class IntegrationConfiguration {
  private _id: string;
  private _integrationTypeId: string;
  private _label: string;
  private _importName: string;
  private _protocol: Protocol; //TODO: is this actually useful?
  private _settings: IntegrationSetting[];

  public get id(): string {
    return this._id;
  }
  public set id(value: string) {
    this._id = value;
  }
  public get integrationTypeId(): string {
    return this._integrationTypeId;
  }
  public set integrationTypeId(value: string) {
    this._integrationTypeId = value;
  }
  public get label(): string {
    return this._label;
  }
  public set label(value: string) {
    this._label = value;
  }
  public get importName(): string {
    return this._importName;
  }
  public set importName(value: string) {
    this._importName = value;
  }
  public get protocol(): Protocol {
    return this._protocol;
  }
  public set protocol(value: Protocol) {
    this._protocol = value;
  }
  public get settings(): IntegrationSetting[] {
    return this._settings;
  }
  public set settings(value: IntegrationSetting[]) {
    this._settings = value;
  }

  // transient
  private _name: string;
  // transient
  private _description: string;
  // transient
  private _nameToSettingMap: Map<string, IntegrationSetting>;

  public get name(): string {
    return this._name;
  }
  public set name(value: string) {
    this._name = value;
  }
  public get description(): string {
    return this._description;
  }
  public set description(value: string) {
    this._description = value;
  }

  private getNameToSettingMap(): Map<string, IntegrationSetting> {
    if (this._nameToSettingMap == null && this._settings != null) {
      let newNameToSettingMap: Map<string, IntegrationSetting> = new Map<
        string,
        IntegrationSetting
      >();
      this._settings.forEach((setting) => {
        newNameToSettingMap.set(setting.name, setting);
      });
      this._nameToSettingMap = newNameToSettingMap;
    } else if (this._settings == null) {
      this._nameToSettingMap = new Map<string, IntegrationSetting>();
    }
    return this._nameToSettingMap;
  }

  public getSettingByName(name: string): IntegrationSetting {
    return this.getNameToSettingMap()?.get(name);
  }

  public addSetting(setting: IntegrationSetting): void {
    if (!this._settings) {
      this._settings = [];
    }
    if (this._nameToSettingMap == null) {
      this._nameToSettingMap = new Map<string, IntegrationSetting>();
    }
    this._settings.push(setting);
    this._nameToSettingMap.set(setting.name, setting);
  }

  public getDisplayValues(): any {
    let integrationMap: any = {
      id: this.id,
      name: this._name,
      label: this.label || this.name,
    };

    if (this.settings != null) {
      let settingsMap: any = {};
      this.settings.forEach((integrationSetting) => {
        if ("password" !== integrationSetting.type) {
          settingsMap[integrationSetting.name] = integrationSetting.value;
        } else {
          settingsMap[integrationSetting.name] = "********";
        }
      });

      integrationMap["settings"] = settingsMap;
    }
    return integrationMap;
  }

  public toJSON() {
    let jsonObj = {
      id: this._id,
      integrationTypeId: this._integrationTypeId,
      label: this._label,
      importName: this._importName,
      protocol: this._protocol,
      settings: new Array<any>(),
    };
    this._settings?.forEach((setting) =>
      jsonObj.settings.push(setting.toJSON())
    );

    return jsonObj;
  }

  public static fromJSON(json: any) {
    let intConfig: IntegrationConfiguration = new IntegrationConfiguration();
    if (json != null) {
      intConfig.id = json.id;
      intConfig.integrationTypeId = json.integrationTypeId;
      intConfig.label = json.label;
      intConfig.importName = json.importName;
      intConfig.protocol = json.protocol;
      intConfig.settings = new Array<IntegrationSetting>();
      json.settings?.forEach((jsonSetting: any) => {
        intConfig.settings.push(IntegrationSetting.fromJSON(jsonSetting));
      });
    }
    return intConfig;
  }
}
