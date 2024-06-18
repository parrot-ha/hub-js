import { describe, expect, test } from "@jest/globals";
import { ZigBeeUtils } from "./zigbee-utils";
import { Device } from "../device/models/device";
import { DeviceWrapper } from "../device/models/device-wrapper";
import { DeviceService } from "../device/device-service";
describe("configure reportings", () => {
  test("configure temperature reporting", () => {
    let zigbee = createZigbee();
    let cr = zigbee.configureReporting(
      0x0402,
      0x0000,
      0x29,
      10,
      43200,
      0x0032,
      {},
      200
    );
    expect(cr).toBeDefined();
    expect(cr.length).toBe(4);
  });
});

describe("parse description as map", () => {
  test("parse read attr", () => {
    let zigbee = createZigbee();
    let parsedDescription = zigbee.parseDescriptionAsMap(
      "read attr - raw: 643f0100060100001000, dni: 643f, endpoint: 01, cluster: 0006, size: 01, attrId: 0000, encoding: 10, command: 0A, value: 00"
    );
    expect(parsedDescription).toBeDefined();
    expect(parsedDescription.size).toBe(11);
    expect(parsedDescription.get("encoding")).toBe("10");
  });
});

describe("parse description as object", () => {
  test("parse empty string", () => {
    let zigbee = createZigbee();
    let parsedDescription = zigbee.parseDescriptionAsObject("");
    expect(parsedDescription).toBeNull();
  });
  test("parse read attr", () => {
    let zigbee = createZigbee();
    let parsedDescription = zigbee.parseDescriptionAsObject(
      "read attr - raw: 643f0100060100001000, dni: 643f, endpoint: 01, cluster: 0006, size: 01, attrId: 0000, encoding: 10, command: 0A, value: 00"
    );
    expect(parsedDescription).toBeDefined();
    expect(parsedDescription.hasOwnProperty("encoding")).toBe(true);
    expect(parsedDescription["encoding"]).toBe("10");
  });
});

describe("level config", () => {
  test("empty level config", () => {
    let zigbee = createZigbee();

    let lc = zigbee.levelConfig();
    expect(lc).toBeDefined();
    expect(lc.length).toBe(4);
    expect(lc[0]).toBe("zdo bind 0x1234 0x01 0x01 0x0008 {0123456789} {}");
    expect(lc[2]).toBe(
      "ph cr 0x1234 0x01 0x0008 0x0000 0x20 0x0001 0x0e10 {01} {}"
    );
  });

  test("level config with minimum report time of 100", () => {
    let zigbee = createZigbee();

    let lc = zigbee.levelConfig(100);
    expect(lc).toBeDefined();
    expect(lc.length).toBe(4);
    expect(lc[0]).toBe("zdo bind 0x1234 0x01 0x01 0x0008 {0123456789} {}");
    expect(lc[2]).toBe(
      "ph cr 0x1234 0x01 0x0008 0x0000 0x20 0x0064 0x0e10 {01} {}"
    );
  });

  test("level config with minimum report time of 5 and maximum report time of 20", () => {
    let zigbee = createZigbee();

    let lc = zigbee.levelConfig(5, 20);
    expect(lc).toBeDefined();
    expect(lc.length).toBe(4);
    expect(lc[0]).toBe("zdo bind 0x1234 0x01 0x01 0x0008 {0123456789} {}");
    expect(lc[2]).toBe(
      "ph cr 0x1234 0x01 0x0008 0x0000 0x20 0x0005 0x0014 {01} {}"
    );
  });

  test("level config with minimum report time of 8 and maximum report time of 25 and reportable change of 2", () => {
    let zigbee = createZigbee();

    let lc = zigbee.levelConfig(8, 25, 2);
    expect(lc).toBeDefined();
    expect(lc.length).toBe(4);
    expect(lc[0]).toBe("zdo bind 0x1234 0x01 0x01 0x0008 {0123456789} {}");
    expect(lc[2]).toBe(
      "ph cr 0x1234 0x01 0x0008 0x0000 0x20 0x0008 0x0019 {02} {}"
    );
  });
});

describe("set level", () => {
  test("set level 100", () => {
    let zigbee = createZigbee();

    let sl = zigbee.setLevel(100);
    expect(sl).toBeDefined();
    expect(sl.length).toBe(2);
    expect(sl[0]).toBe("ph cmd 0x1234 0x01 0x0008 0x04 {fe ffff} {}");
  });

  test("level config with minimum report time of 100", () => {
    let zigbee = createZigbee();

    let sl = zigbee.setLevel(12);
    expect(sl).toBeDefined();
    expect(sl.length).toBe(2);
    expect(sl[0]).toBe("ph cmd 0x1234 0x01 0x0008 0x04 {1e ffff} {}");
  });

  test("level config with minimum report time of 5 and maximum report time of 20", () => {
    let zigbee = createZigbee();

    let sl = zigbee.setLevel(100, 100);
    expect(sl).toBeDefined();
    expect(sl.length).toBe(2);
    expect(sl[0]).toBe("ph cmd 0x1234 0x01 0x0008 0x04 {fe 6400} {}");
  });

  test("level config with minimum report time of 8 and maximum report time of 25 and reportable change of 2", () => {
    let zigbee = createZigbee();

    let sl = zigbee.setLevel(1.0);
    expect(sl).toBeDefined();
    expect(sl.length).toBe(2);
    expect(sl[0]).toBe("ph cmd 0x1234 0x01 0x0008 0x04 {03 ffff} {}");
  });
});

function createZigbee(): ZigBeeUtils {
  let device = new Device();
  device.deviceNetworkId = "1234";
  device.integration.options = { endpointId: "01", zigbeeId: "0123456789" };
  let zigbee = new ZigBeeUtils(new DeviceWrapper(device, {} as DeviceService));
  return zigbee;
}
