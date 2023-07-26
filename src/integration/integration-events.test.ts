import { describe, expect, test } from "@jest/globals";
import {
  IntegrationEvent,
  IntegrationHubEvent,
  DeviceEvent,
  DeviceMessageEvent,
} from "./integration-events";

describe("Test integration events", () => {
  test("check type of event", () => {
    let evt = new IntegrationHubEvent("testName", "xyz", "xyz event", true);
    expect(evt instanceof IntegrationEvent).toBe(true);
    expect(evt instanceof IntegrationHubEvent).toBe(true);
    expect(evt instanceof DeviceEvent).toBe(false);
  });

  test("create device message event", () => {
    let idme = new DeviceMessageEvent("123", "hello world");
    expect(idme instanceof DeviceMessageEvent).toBe(true);
    expect(idme.deviceNetworkId).toBe("123");
    expect(idme.message).toBe("hello world");
  });

  test("setting and getting integration id", () => {
    let ihe = new IntegrationHubEvent(
      "ssdp",
      "value",
      "ssdp term event",
      false
    );
    ihe.integrationId = "456";
    expect(ihe.integrationId).toBe("456");
    expect(ihe instanceof IntegrationHubEvent).toBe(true);
    expect(ihe instanceof IntegrationEvent).toBe(true);
    expect(ihe instanceof DeviceEvent).toBe(false);
  });
});
