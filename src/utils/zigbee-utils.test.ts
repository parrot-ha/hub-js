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
