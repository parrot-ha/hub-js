import { Protocol } from "../device/models/protocol";
import { HubAction } from "../device/models/hub-action";
import { HubResponse } from "../device/models/hub-response";
import { AbstractIntegration, IntegrationType } from "./abstract-integration";
import { DeviceIntegration } from "./device-integration";

const logger = require("../hub/logger-service")({
  source: "IntegrationRegistry",
});

export class IntegrationRegistry {
  private _integrationRegistry: Map<IntegrationType, AbstractIntegration[]> =
    new Map<IntegrationType, AbstractIntegration[]>();
  private _integrationIdMap: Map<string, AbstractIntegration> = new Map<
    string,
    AbstractIntegration
  >();

  public registerIntegration(integration: AbstractIntegration): void {
    this._integrationIdMap.set(integration.id, integration);

    if (integration instanceof DeviceIntegration) {
      if ((integration as DeviceIntegration).getProtocol() == Protocol.ZIGBEE) {
        this.addToRegistry(IntegrationType.ZIGBEE, integration);
      } else if (integration.getProtocol() == Protocol.ZWAVE) {
        this.addToRegistry(IntegrationType.ZWAVE, integration);
      } else if (integration.getProtocol() == Protocol.LAN) {
        this.addToRegistry(IntegrationType.LAN, integration);
      } else {
        this.addToRegistry(IntegrationType.DEVICE, integration);
      }
    }
    //   if (integration instanceof CloudIntegration) {
    //     this.addToRegistry(AbstractIntegration.IntegrationType.CLOUD, integration);
    //   }
  }

  private addToRegistry(
    integrationType: IntegrationType,
    integration: AbstractIntegration
  ): void {
    if (this._integrationRegistry.get(integrationType) == null) {
      this._integrationRegistry.set(integrationType, []);
    }
    this._integrationRegistry.get(integrationType).push(integration);
  }

  public unregisterIntegration(integration: AbstractIntegration): void {
    if (integration == null) {
      return;
    }
    this._integrationIdMap.delete(integration.id);

    if (integration instanceof DeviceIntegration) {
      if (integration.getProtocol() == Protocol.ZIGBEE) {
        this.unregisterIntegrationType(IntegrationType.ZIGBEE, integration);
      } else if (integration.getProtocol() == Protocol.ZWAVE) {
        this.unregisterIntegrationType(IntegrationType.ZWAVE, integration);
      } else if (integration.getProtocol() == Protocol.LAN) {
        this.unregisterIntegrationType(IntegrationType.LAN, integration);
      } else {
        this.unregisterIntegrationType(IntegrationType.DEVICE, integration);
      }
    }
    //   if (integration instanceof CloudIntegration) {
    //     this.unregisterIntegrationType(IntegrationType.CLOUD, integration);
    //   }
  }

  private unregisterIntegrationType(
    integrationType: IntegrationType,
    integration: AbstractIntegration
  ): void {
    let integrations: AbstractIntegration[] =
      this._integrationRegistry.get(integrationType);
    if (integrations != null) {
      this._integrationRegistry.set(
        integrationType,
        integrations.filter(
          (intArrayItem) => intArrayItem.id !== integration.id
        )
      );
    }
  }

  public getIntegration(integrationType: IntegrationType): AbstractIntegration {
    let integrations: AbstractIntegration[] =
      this.getIntegrations(integrationType);
    return integrations != null && integrations.length > 0
      ? integrations[0]
      : null;
  }

  public getIntegrations(
    integrationType: IntegrationType
  ): AbstractIntegration[] {
    return this._integrationRegistry.get(integrationType);
  }

  public getIntegrationById(id: string): AbstractIntegration {
    return this._integrationIdMap.get(id);
  }

  public getDeviceIntegrationById(id: string): DeviceIntegration {
    let abstractIntegration: AbstractIntegration = this.getIntegrationById(id);
    if (abstractIntegration instanceof DeviceIntegration) {
      return abstractIntegration;
    }
    return null;
  }

  private getIntegrationsByProtocol(protocol: Protocol): AbstractIntegration[] {
    switch (protocol) {
      case Protocol.ZIGBEE:
        return this.getIntegrations(IntegrationType.ZIGBEE);
      case Protocol.LAN:
        return this.getIntegrations(IntegrationType.LAN);
      case Protocol.ZWAVE:
        return this.getIntegrations(IntegrationType.ZWAVE);
    }
    return null;
  }

  public processAction(
    integrationId: string,
    hubAction: HubAction
  ): HubResponse {
    if (integrationId != null) {
      let deviceIntegration: DeviceIntegration =
        this.getDeviceIntegrationById(integrationId);
      if (deviceIntegration != null) {
        return deviceIntegration.processAction(hubAction);
      }
    } else if (hubAction.protocol != null) {
      let integrations: AbstractIntegration[] = this.getIntegrationsByProtocol(
        hubAction.protocol
      );
      // send message to all integrations that can handle it (usually only 1)
      if (integrations != null) {
        for (let integration of integrations) {
          if (integration instanceof DeviceIntegration) {
            //TODO: how to handle multiple integrations? right now, just use first one.
            return integration.processAction(hubAction);
          }
        }
      }
    }
    return null;
  }

  // public boolean removeDevice(String integrationId, String deviceNetworkId, boolean force) {
  //     DeviceIntegration deviceIntegration = getDeviceIntegrationById(integrationId);
  //     if (deviceIntegration != null) {
  //         try {
  //             return deviceIntegration.removeIntegrationDevice(deviceNetworkId, force);
  //         } catch (AbstractMethodError ame) {
  //             return deviceIntegration.removeIntegrationDevice(deviceNetworkId);
  //         }
  //     } else {
  //         logger.warn("Unknown integration: " + integrationId);
  //         return true;
  //     }
  // }

  // public Future<Boolean> removeDeviceAsync(String integrationId, String deviceNetworkId, boolean force) {
  //     DeviceIntegration deviceIntegration = getDeviceIntegrationById(integrationId);
  //     if (deviceIntegration != null) {
  //         try {
  //             return deviceIntegration.removeIntegrationDeviceAsync(deviceNetworkId, force);
  //         } catch (AbstractMethodError ame) {
  //             boolean removeDeviceResult = removeDevice(integrationId, deviceNetworkId, force);
  //             return CompletableFuture.completedFuture(removeDeviceResult);
  //         }
  //     } else {
  //         logger.warn("Unknown integration: " + integrationId);
  //         // if integration does not exist, then device is "removed"
  //         return CompletableFuture.completedFuture(true);
  //     }
  // }
}
