import { Protocol } from "../device/models/protocol";
import { DeviceService } from "../device/device-service";
import { EntityService } from "../entity/entity-service";
import { IntegrationConfiguration } from "./models/integration-configuration";
import {
  DeviceAddedEvent,
  DeviceEvent,
  DeviceMessageEvent,
  LanDeviceMessageEvent,
} from "./integration-events";
import { IntegrationSetting } from "./models/integration-setting";
import { IntegrationDataStore } from "./integration-data-store";
import { AbstractIntegration } from "./abstract-integration";
import { DeviceIntegration } from "./device-integration";
import { isNotBlank } from "../utils/string-utils";
import { IntegrationRegistry } from "./integration-registry";
import { ResetIntegrationExtension } from "./reset-integration-extension";
import { randomUUID } from "crypto";
import { DeviceScanIntegrationExtension } from "./device-scan-integration-extension";
import { Device } from "../device/models/device";
const logger = require("../hub/logger-service")({
  source: "IntegrationService",
});

export class IntegrationService {
  private _integrationDataStore: IntegrationDataStore;
  private _integrationRegistry: IntegrationRegistry;
  private _entityService: EntityService;
  private _deviceService: DeviceService;

  private _integrationMap: Map<string, AbstractIntegration>;
  private _integrationTypeMap: Map<string, any>;
  private _protocolListMap: Map<Protocol, String[]>;

  constructor(
    integrationDataStore: IntegrationDataStore,
    integrationRegistry: IntegrationRegistry,
    entityService: EntityService,
    deviceService: DeviceService
  ) {
    this._integrationDataStore = integrationDataStore;
    this._integrationRegistry = integrationRegistry;
    this._entityService = entityService;
    this._deviceService = deviceService;
  }

  public getIntegrationTypes(): any[] {
    let integrationTypeMap = this.getIntegrationTypeMap();

    let availableIntegrations: any[] = new Array<any>();
    if (integrationTypeMap != null) {
      Array.from(integrationTypeMap.values()).forEach((integrationType) => {
        availableIntegrations.push({
          id: integrationType.id,
          name: integrationType.name,
          description: integrationType.description,
        });
      });
    }
    return availableIntegrations;
  }

  private getIntegrationTypeMap(): Map<string, any> {
    if (this._integrationTypeMap == null) {
      this._integrationTypeMap = this.loadIntegrationTypes();
    }
    return this._integrationTypeMap;
  }

  public initialize(): void {
    this._integrationTypeMap = this.loadIntegrationTypes();

    let integrationMap = this.getIntegrationMap();
    if (integrationMap != null) {
      for (let [integrationId, abstractIntegration] of integrationMap) {
        if (abstractIntegration != null) {
          try {
            abstractIntegration.integrationService = this;
            this.initializeIntegration(abstractIntegration);
            this._integrationRegistry.registerIntegration(abstractIntegration);
            abstractIntegration.id = integrationId;
            abstractIntegration.start();
          } catch (err) {
            logger.warn(
              `Exception while starting integration ${integrationId}`,
              err
            );
          }
        }
      }
    }
  }

  public shutdown(): Promise<any> {
    let promises: Promise<any>[] = [];

    if (this._integrationMap != null) {
      Array.from(this._integrationMap?.values()).forEach((integration) => {
        integration.off("event", this.eventReceived);
        promises.push(integration.stop());
      });
    }
    return Promise.all(promises);
  }

  public eventReceived(event: any): void {
    logger.debug("got event: " + JSON.stringify(event));
    if (event instanceof DeviceEvent) {
      if (event instanceof DeviceMessageEvent) {
        if (event instanceof LanDeviceMessageEvent) {
          this.lanDeviceMessageReceived(event as LanDeviceMessageEvent);
        } else {
          this._entityService.runDeviceMethodByDNI(
            event.integrationId,
            event.deviceNetworkId,
            "parse",
            [event.message]
          );
        }
      } else if (event instanceof DeviceAddedEvent) {
        // only add device if user initiated the addition, this could also mean that the user allowed the integration to automatically add devices
        if (event?.isUserInitiatedAdd === true) {
          let fingerprint = event.fingerprint;
          let deviceHandlerInfo =
            this._entityService.getDeviceHandlerByFingerprint(fingerprint);

          if (deviceHandlerInfo != null) {
            let deviceHandlerId: string = deviceHandlerInfo.id;
            let deviceName: string = deviceHandlerInfo.joinName;
            let d: Device = new Device();
            //handle integration
            d.integration.id = event.integrationId;
            if (event.additionalParameters instanceof Map) {
              d.integration.options = Object.fromEntries(
                event.additionalParameters
              );
            } else {
              d.integration.options = event.additionalParameters;
            }
            if (event.data instanceof Map) {
              d.data = Object.fromEntries(event.data);
            } else {
              d.data = event.data;
            }
            d.deviceNetworkId = event.deviceNetworkId;
            d.name = deviceName;
            d.deviceHandlerId = deviceHandlerId;

            let deviceId = this._deviceService.addDevice(d);

            let capabilityList: string[] = this._deviceService.getDeviceHandler(
              this._deviceService.getDevice(deviceId).deviceHandlerId
            ).capabilityList;
            if (
              capabilityList != null &&
              capabilityList.indexOf("Configuration") > -1
            ) {
              this._entityService.runDeviceMethod(deviceId, "configure", null);
            }
            this._entityService.runDeviceMethod(deviceId, "installed", null);
          }
        }
      }
    } else {
      logger.debug("unknown event type");
    }
  }

  public isResetIntegrationExtension(
    obj: any
  ): obj is ResetIntegrationExtension {
    return "reset" in obj && "getResetWarning" in obj;
  }

  public isDeviceScanIntegrationExtension(
    obj: any
  ): obj is DeviceScanIntegrationExtension {
    return "startScan" in obj && "stopScan" in obj && "getScanStatus" in obj;
  }

  private lanDeviceMessageReceived(event: LanDeviceMessageEvent): void {
    // look for device based on mac address first
    if (
      this._deviceService.deviceExists(event.integrationId, event.macAddress)
    ) {
      this._entityService.runDeviceMethodByDNI(
        event.integrationId,
        event.macAddress,
        "parse",
        [event.message]
      );
      return;
    }

    let portHexString: string = event.remotePort.toString(16).padStart(4, "0");
    let ipAddressHexString: string = event.remoteAddress
      .split(".")
      .map((element) => parseInt(element).toString(16).padStart(2, "0"))
      .join("");

    // next look for device based on ip address : port
    let ipAddressAndPortHexString: string =
      ipAddressHexString + ":" + portHexString;
    if (
      this._deviceService.deviceExists(
        event.integrationId,
        ipAddressAndPortHexString
      )
    ) {
      this._entityService.runDeviceMethodByDNI(
        event.integrationId,
        ipAddressAndPortHexString,
        "parse",
        [event.message]
      );
      return;
    }

    // look for device based on ip address
    if (
      this._deviceService.deviceExists(event.integrationId, ipAddressHexString)
    ) {
      this._entityService.runDeviceMethodByDNI(
        event.integrationId,
        ipAddressHexString,
        "parse",
        [event.message]
      );
      return;
    }

    // look for device without integration id

    // look for device based on mac address first
    if (this._deviceService.deviceExists(null, event.macAddress)) {
      this._entityService.runDeviceMethodByDNI(
        null,
        event.macAddress,
        "parse",
        [event.message]
      );
      return;
    }

    // next look for device based on ip address : port
    if (this._deviceService.deviceExists(null, ipAddressAndPortHexString)) {
      this._entityService.runDeviceMethodByDNI(
        null,
        ipAddressAndPortHexString,
        "parse",
        [event.message]
      );
      return;
    }

    // look for device based on ip address
    if (this._deviceService.deviceExists(null, ipAddressHexString)) {
      this._entityService.runDeviceMethodByDNI(
        null,
        ipAddressHexString,
        "parse",
        [event.message]
      );
      return;
    }

    // Finally, send message as hub event if no match above, it appears that Smartthings used to do this.
    // TODO: is lanMessage the right name of the event?  Can't find documentation about it.
    this._entityService.sendHubEvent({
      name: "lanMessage",
      value: event.macAddress,
      description: event.message,
    });
  }

  /*
   * Integration types
   */
  private loadIntegrationTypes(): Map<string, any> {
    let integrations = new Map<string, any>();

    //TODO: load integrations built in
    //TODO: make this dynamic, not hard coded

    //return new Promise<any>((resolve) => {
    let importName = "../lan-integration/lan-integration";
    let IntegrationClass = require(importName).default;
    let integration: AbstractIntegration = new IntegrationClass();

    let lanIntegrationObj = {
      id: "126cd597-ff83-476c-83d0-d255cfd94983",
      type: "SYSTEM",
      name: integration.name,
      importName: importName,
      description: integration.description,
    };
    integrations.set(lanIntegrationObj.id, lanIntegrationObj);

    importName = "../zigbee-integration/zigbee-integration";
    IntegrationClass = require(importName).default;
    let integration2 = new IntegrationClass();

    let zigbeeIntegrationObj = {
      id: "f49a8c58-3e9b-4d62-85ae-17a06e606326",
      type: "SYSTEM",
      name: integration2.name,
      importName: importName,
      description: integration2.description,
    };
    integrations.set(zigbeeIntegrationObj.id, zigbeeIntegrationObj);

    return integrations;
  }

  /*
   * Integration implementation methods
   */

  private getIntegrationMap(): Map<string, AbstractIntegration> {
    if (this._integrationMap === null || this._integrationMap === undefined) {
      this.loadIntegrationMap();
    }
    return this._integrationMap;
  }

  private loadIntegrationMap(): void {
    if (this._integrationMap != null) {
      return;
    }

    let temporaryIntegrationMap: Map<string, AbstractIntegration> = new Map<
      string,
      AbstractIntegration
    >();
    let temporaryProtocolListMap: Map<Protocol, String[]> = new Map<
      Protocol,
      String[]
    >();

    let integrationConfigurations =
      this._integrationDataStore.getIntegrations();
    if (integrationConfigurations != null) {
      for (let integrationConfiguration of integrationConfigurations) {
        let abstractIntegration = this.getAbstractIntegrationFromConfiguration(
          integrationConfiguration
        );
        if (abstractIntegration != null) {
          temporaryIntegrationMap.set(
            integrationConfiguration.id,
            abstractIntegration
          );
          let integrationIdArray = temporaryProtocolListMap.get(
            integrationConfiguration.protocol
          );
          if (!integrationIdArray) integrationIdArray = [];
          integrationIdArray.push(integrationConfiguration.id);
          temporaryProtocolListMap.set(
            integrationConfiguration.protocol,
            integrationIdArray
          );
        }
      }
    }
    this._integrationMap = temporaryIntegrationMap;
    this._protocolListMap = temporaryProtocolListMap;
  }

  public getIntegrationById(id: string): AbstractIntegration {
    return this.getIntegrationMap().get(id);
  }

  private getAbstractIntegrationByTypeId(
    integrationTypeId: string
  ): AbstractIntegration {
    let abstractIntegrationType =
      this.getIntegrationTypeMap()?.get(integrationTypeId);

    let importName = abstractIntegrationType.importName;
    let IntegrationClass = require(importName).default;
    let abstractIntegration: AbstractIntegration = new IntegrationClass();
    abstractIntegration.id = abstractIntegrationType.id;
    abstractIntegration.integrationService = this;

    return abstractIntegration;
  }

  private getAbstractIntegrationFromConfiguration(
    integrationConfiguration: IntegrationConfiguration
  ): AbstractIntegration {
    let abstractIntegration: AbstractIntegration = null;
    if (isNotBlank(integrationConfiguration.integrationTypeId)) {
      abstractIntegration = this.getAbstractIntegrationByTypeId(
        integrationConfiguration.integrationTypeId
      );
    } else {
      let integrationInfo = Array.from(
        this.getIntegrationTypeMap().values()
      ).find((m) => integrationConfiguration.importName == m.importName);
      if (integrationInfo?.id) {
        abstractIntegration = this.getAbstractIntegrationByTypeId(
          integrationInfo.id
        );
      }
    }

    if (abstractIntegration != null) {
      abstractIntegration.id = integrationConfiguration.id;
    }

    return abstractIntegration;
  }

  public createIntegration(integrationTypeId: string): string {
    let integration: AbstractIntegration =
      this.getAbstractIntegrationByTypeId(integrationTypeId);

    let integrationId: string;
    if (integration instanceof DeviceIntegration) {
      integrationId = this.addIntegrationConfiguration(
        (integration as DeviceIntegration).getProtocol(),
        integrationTypeId,
        integration.getDefaultSettings()
      );
    } else {
      integrationId = this.addIntegrationConfiguration(
        null,
        integrationTypeId,
        integration.getDefaultSettings()
      );
    }

    let integrationConfiguration: IntegrationConfiguration =
      this.getIntegrationConfigurationById(integrationId);

    let abstractIntegration: AbstractIntegration =
      this.getAbstractIntegrationFromConfiguration(integrationConfiguration);
    if (this.getIntegrationMap() == null) {
      this._integrationMap = new Map<string, AbstractIntegration>();
    }
    this.getIntegrationMap().set(
      integrationConfiguration.id,
      abstractIntegration
    );

    abstractIntegration.id = integrationId;
    this.initializeIntegration(abstractIntegration);
    this._integrationRegistry.registerIntegration(abstractIntegration);

    try {
      abstractIntegration.start();
    } catch (err) {
      logger.warn("Exception occurred while starting integration.", err);
    }

    return integrationId;
  }

  public removeIntegration(id: string): Promise<boolean> {
    let removeConfig = function (
      resolve: any,
      integration: AbstractIntegration
    ) {
      let integrationConfigurationRemoved =
        this._integrationDataStore.removeIntegrationConfiguration(id);

      if (integrationConfigurationRemoved) {
        this.getIntegrationMap().delete(id);

        // remove integration from any protocol lists
        if (this._protocolListMap != null) {
          for (let protocolList of this._protocolListMap.values()) {
            if (protocolList != null) {
              protocolList = protocolList.filter((pli: string) => pli !== id);
            }
          }
        }

        // remove integration from registry
        this._integrationRegistry.unregisterIntegration(integration);

        resolve(true);
      } else {
        resolve(false);
      }
    };

    return new Promise<boolean>((resolve) => {
      let integration = this.getIntegrationById(id);
      if (integration != null) {
        integration.stop().then(() => {
          removeConfig(resolve, integration);
        });
      } else {
        removeConfig(resolve, integration);
      }
    });
  }

  private initializeIntegration(
    abstractIntegration: AbstractIntegration
  ): void {
    abstractIntegration.on("event", this.eventReceived.bind(this));
  }

  /*
   * Integration configuration methods
   */

  public getIntegrationSettings(integrationId: string): IntegrationSetting[] {
    return this._integrationDataStore.getIntegrationSettings(integrationId);
  }

  public getIntegrationConfigurationValue(
    integrationId: string,
    configurationId: string
  ): string {
    return this._integrationDataStore.getIntegrationSettingValue(
      integrationId,
      configurationId
    );
  }

  public updateIntegrationSettingValue(
    integrationId: string,
    configurationKey: string,
    configurationValue: any,
    type: string,
    multiple: boolean
  ): void {
    return this._integrationDataStore.updateIntegrationSettingValue(
      integrationId,
      configurationKey,
      configurationValue,
      type,
      multiple
    );
  }

  public updateIntegrationSettings(id: string, settingsMap: any): void {
    let integrationConfiguration: IntegrationConfiguration =
      this.getIntegrationConfigurationById(id);

    let changedKeys: string[] = [];
    for (let key of Object.keys(settingsMap)) {
      let setting = settingsMap[key];

      if ("label" === key) {
        integrationConfiguration.label = setting["value"];
      } else {
        let existingSetting = integrationConfiguration.getSettingByName(key);
        if (existingSetting != null) {
          let value = setting["value"];
          // update existing setting
          // TODO: create method on IntegrationSetting to check for changes.
          if (
            (existingSetting.value == null && value != null) ||
            (existingSetting.value != null && value == null) ||
            (existingSetting.value != null &&
              value != null &&
              existingSetting.value !== value.toString())
          ) {
            existingSetting.processValueTypeAndMultiple(
              setting["value"],
              setting["type"],
              setting["multiple"]
            );

            // add to list of changed fields
            changedKeys.push(key);
          }
        } else {
          // create new setting
          existingSetting = new IntegrationSetting();
          existingSetting.id = randomUUID();
          existingSetting.name = key;
          existingSetting.processValueTypeAndMultiple(
            setting["value"],
            setting["type"],
            setting["multiple"]
          );
          integrationConfiguration.addSetting(existingSetting);

          // add to list of changed fields
          changedKeys.push(key);
        }
      }
    }
    this._integrationDataStore.updateIntegrationConfiguration(
      integrationConfiguration
    );

    // send list of changed keys to the integration
    if (changedKeys.length > 0) {
      this.getIntegrationById(id).settingValueChanged(changedKeys);
    }
  }

  public addIntegrationConfiguration(
    protocol: Protocol,
    integrationTypeId: string,
    settings: IntegrationSetting[]
  ): string {
    return this._integrationDataStore.addIntegrationConfiguration(
      protocol,
      integrationTypeId,
      settings
    );
  }

  public getIntegrationConfigurationById(id: string): IntegrationConfiguration {
    return this._integrationDataStore.getIntegrationById(id);
  }

  public getIntegrationConfigurations(
    includeName: boolean = true
  ): IntegrationConfiguration[] {
    let integrationConfigs = this._integrationDataStore.getIntegrations();

    if (includeName) {
      integrationConfigs?.forEach((integrationConfig) => {
        let abstractIntegration: AbstractIntegration = this.getIntegrationById(
          integrationConfig.id
        );
        if (abstractIntegration != null) {
          integrationConfig.name = abstractIntegration.name;
        } else {
          integrationConfig.name = "UNKNOWN";
        }
      });
    }
    return integrationConfigs;
  }
}
