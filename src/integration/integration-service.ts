import { Protocol } from "../device/models/protocol";
import { DeviceService } from "../device/device-service";
import { EntityService } from "../entity/entity-service";
import { IntegrationConfiguration } from "./models/integration-configuration";
import {
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
const logger = require("../hub/logger-service")({
  source: "IntegrationService",
});

export class IntegrationService {
  private _integrationDataStore: IntegrationDataStore;
  private _integrationRegistry: IntegrationRegistry;
  private _entityService: EntityService;
  private _deviceService: DeviceService;

  // private _lanIntegration: LanIntegration;

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

    // if (this.getIntegrationTypeMap() != null) {
    //   Array.from(this.getIntegrationTypeMap().values()).forEach(
    //     (integrationType) => {
    //       availableIntegrations.push({
    //         id: integrationType.id,
    //         name: integrationType.name,
    //         description: integrationType.description,
    //       });
    //     }
    //   );
    // }
    // return availableIntegrations;
  }

  private getIntegrationTypeMap(): Map<string, any> {
    if (this._integrationTypeMap == null) {
      this._integrationTypeMap = this.loadIntegrationTypes();
    }
    return this._integrationTypeMap;
  }

  public initialize(): void {
    //this._integrationMap = new Map<string, AbstractIntegration>();

    // TODO: move to dynamic instead of hard coded Lan integration
    // const LanIntegration2 = import("../lan-integration/lan-integration").then(
    //   (IntegrationClass) => {
    //     let integration: AbstractIntegration = new IntegrationClass.default();
    //     integration.id = "11cb3a64-156e-460f-9675-e6b017d02437";
    //     this.initializeIntegration(integration);
    //     integration.start();
    //     this._integrationMap.set(integration.id, integration);
    //   }
    // );
    // let lanIntegration = new LanIntegration2();
    // lanIntegration.id = "11cb3a64-156e-460f-9675-e6b017d02437";
    // lanIntegration.on("event", this.eventReceived.bind(this));
    // lanIntegration.start();
    // this._integrationMap.set(lanIntegration.id, lanIntegration);

    this.loadIntegrationTypes();

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
    console.log("got event", JSON.stringify(event));
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
      }
    }
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
    const IntegrationClass = require(importName).default;
    //const LanIntegration2 = import(importName).then((IntegrationClass) => {
    let integration: AbstractIntegration = new IntegrationClass();

    let lanIntegrationObj = {
      id: "126cd597-ff83-476c-83d0-d255cfd94983",
      type: "SYSTEM",
      name: integration.name,
      importName: importName,
      description: integration.description,
    };
    integrations.set(lanIntegrationObj.id, lanIntegrationObj);
    //this._integrationTypeMap = integrations;
    return integrations;
    //let integration: AbstractIntegration = new IntegrationClass.default();
    // integration.id = "11cb3a64-156e-460f-9675-e6b017d02437";
    // integration.on("event", this.eventReceived.bind(this));
    // integration.start();
    // this._integrationMap.set(integration.id, integration);
    //});

    //TODO: load integrations from extensions
    //});
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
    this.getIntegrationTypeMap();
    let importName = "../lan-integration/lan-integration";
    let UnknownIntegration = require(importName).default;
    let unknownIntegration = new UnknownIntegration();
    if (unknownIntegration instanceof AbstractIntegration) {
      return unknownIntegration;
    } else {
      //TODO: throw error?
      return null;
    }
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

    // if (this._protocolListMap == null) {
    //     this._protocolListMap = new HashMap<>();
    // }
    // this._protocolListMap.computeIfAbsent(integrationConfiguration.getProtocol(), k -> new ArrayList<>()).add(integrationConfiguration.getId());

    // abstractIntegration.setConfigurationService(new IntegrationConfigurationServiceImpl(this));

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

  private initializeIntegration(
    abstractIntegration: AbstractIntegration
  ): void {
    abstractIntegration.on("event", this.eventReceived.bind(this));
    // if (abstractIntegration instanceof DeviceIntegration) {
    //     ((DeviceIntegration) abstractIntegration).setDeviceIntegrationService(deviceIntegrationService);
    // }
    // if (abstractIntegration instanceof CloudIntegration) {
    //     ((CloudIntegration) abstractIntegration).setCloudIntegrationService(new CloudIntegrationServiceImpl(entityService, locationService));
    // }
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
