import { describe, expect, test } from "@jest/globals";
import {
  IntegrationEvent,
  IntegrationHubEvent,
  DeviceEvent,
  DeviceMessageEvent,
  DeviceUpdatedEvent,
} from "./integration-events";
import { IntegrationService } from "./integration-service";
import { IntegrationDataStore } from "./integration-data-store";
import { IntegrationRegistry } from "./integration-registry";
import { EntityService } from "../entity/entity-service";
import { DeviceService } from "../device/device-service";
import { Device } from "../device/models/device";
import { Integration } from "../hub/models/integration";

describe("Test integration events", () => {
  test("check type of event", () => {
    let device = new Device();
    device.deviceNetworkId = "5678";
    device.integration = new Integration();
    device.integration.id = "abcdef";
    device.integration.options = { zigbeeId: "ABCDEF6789" };
    let deviceService = {
      getDevices: jest.fn(() => [device]),
      updateDevice: jest.fn(),
    };

    let integrationService = new IntegrationService(
      {} as IntegrationDataStore,
      {} as IntegrationRegistry,
      {} as EntityService,
      deviceService as unknown as DeviceService,
    );

    let additionalParams: Map<string, string> = new Map<string, string>();
    additionalParams.set("zigbeeId", "ABCDEF6789");

    let deviceUpdatedEvent = new DeviceUpdatedEvent("1234", "deviceNetworkId", additionalParams);
    deviceUpdatedEvent.integrationId = "abcdef"

    integrationService.eventReceived(
      deviceUpdatedEvent
    );

    expect(deviceService.getDevices).toBeCalledTimes(1);
    expect(deviceService.updateDevice).toBeCalledTimes(1);
  });
});
