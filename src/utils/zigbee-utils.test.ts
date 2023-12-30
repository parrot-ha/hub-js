import { describe, expect, test } from "@jest/globals";
import {ZigBeeUtils} from "./zigbee-utils"
import { Device } from "../device/models/device";
import { DeviceWrapper } from "../device/models/device-wrapper";
import { DeviceService } from "../device/device-service";
describe("configure reportings", () => {
  test("configure temperature reporting", () => {
    let device = new Device();
    device.deviceNetworkId = "1234"
    device.integration.options = {endpointId: "01"};

    let zigbee = new ZigBeeUtils(new DeviceWrapper(device, {} as DeviceService));
    let cr = zigbee.configureReporting(0x0402, 0x0000, 0x29, 10, 43200, 0x0032, {}, 200);
    expect(cr).toBeDefined();
    expect(cr.length).toBe(4);
  });
});

describe("parse description as map", () => {
  test("parse read attr", () => {
    let device = new Device();
    device.deviceNetworkId = "1234"
    device.integration.options = {endpointId: "01"};
    let zigbee = new ZigBeeUtils(new DeviceWrapper(device, {} as DeviceService));
    let parsedDescription = zigbee.parseDescriptionAsMap("read attr - raw: 643f0100060100001000, dni: 643f, endpoint: 01, cluster: 0006, size: 01, attrId: 0000, encoding: 10, command: 0A, value: 00");
    expect(parsedDescription).toBeDefined();
    expect(parsedDescription.size).toBe(11);
    expect(parsedDescription.get("encoding")).toBe("10");
  });
});

describe("parse description as object", () => {
  test("parse read attr", () => {
    let device = new Device();
    device.deviceNetworkId = "1234"
    device.integration.options = {endpointId: "01"};
    let zigbee = new ZigBeeUtils(new DeviceWrapper(device, {} as DeviceService));
    let parsedDescription = zigbee.parseDescriptionAsObject("read attr - raw: 643f0100060100001000, dni: 643f, endpoint: 01, cluster: 0006, size: 01, attrId: 0000, encoding: 10, command: 0A, value: 00");
    expect(parsedDescription).toBeDefined();
    expect(parsedDescription.hasOwnProperty("encoding")).toBe(true);
    expect(parsedDescription["encoding"]).toBe("10");
  });
});
