import { Protocol } from "../device/models/protocol";
import { HubAction } from "../device/models/hub-action";
import { AbstractIntegration } from "./abstract-integration";
import { HubResponse } from "../device/models/hub-response";

export abstract class DeviceIntegration extends AbstractIntegration {
  public abstract removeIntegrationDeviceAsync(
    deviceNetworkId: string,
    force: boolean
  ): Promise<boolean>;

  public abstract processAction(action: HubAction): HubResponse;

  // override if you want to provide tags to filter device handlers by
  public get tags(): string[] {
    return [];
  }

      // override if you want to specify the protocol that this integration supports
    // in general, it should be other, but if you want a specific system-wide handling of
    // a protocol, this is where it is specified.
    public  getProtocol(): Protocol {
      return Protocol.OTHER;
  }
}
