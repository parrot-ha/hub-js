import { HubAction } from "../device/models/hub-action";
import { AbstractIntegration } from "./abstract-integration";

export abstract class DeviceIntegration extends AbstractIntegration {
  public abstract removeIntegrationDeviceAsync(
    deviceNetworkId: string,
    force: boolean
  ): Promise<boolean>;

  public abstract processAction(action: HubAction): string;
}
