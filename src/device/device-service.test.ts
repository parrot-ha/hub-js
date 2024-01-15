import { describe, expect, test } from "@jest/globals";
import { DeviceService } from "./device-service";
import { DeviceHandler } from "./models/device-handler";
import { Fingerprint } from "./models/fingerprint";
import { IntegrationRegistry } from "../integration/integration-registry";
import { DeviceDataStore } from "./device-data-store";

describe("get Device Handler By Fingerprint", () => {
  test("empty device info", () => {
    let mockGetDeviceHandlers = jest.fn(() => []);
    let mockDeviceDataStore = {
      getDeviceHandlers: function () {
        let dh = new DeviceHandler();
        dh.id = "789";
        dh.name = "Thing";
        dh.namespace = "parrotha.device.virtual";
        return [dh];
      },
    };

    let deviceService = new DeviceService(
      mockDeviceDataStore as unknown as DeviceDataStore,
      {} as IntegrationRegistry
    );

    let deviceHandlerInfo = deviceService.getDeviceHandlerByFingerprint(
      new Map<string, string>()
    );
    expect(deviceHandlerInfo).not.toBeNull();
    expect(deviceHandlerInfo.id).toBe("789");
    expect(deviceHandlerInfo.joinName).toBe("Unknown Device");
  });

  test("single fingerprint matches device info", () => {
    let mockGetDeviceHandlers = jest.fn(() => []);
    let mockDeviceDataStore = {
      getDeviceHandlers: function () {
        let dh = new DeviceHandler();
        dh.id = "456";
        let fingerprint1 = Fingerprint.buildFromObject({
          profileId: "0104",
          inClusters: "0000,0003,0004,0005,0006,0B05,FC01,FC08",
          outClusters: "0003,0019",
          manufacturer: "LEDVANCE",
          model: "PLUG",
          deviceJoinName: "SYLVANIA Outlet",
        });
        let fingerprint2 = Fingerprint.buildFromObject({
          profileId: "0104",
          inClusters: "0000,0003,0004,0005,0006,0702,0b04,0b05,fc03",
          outClusters: "0019",
          manufacturer: "CentraLite",
          model: "3210-L",
          deviceJoinName: "Smartthings Outlet",
        });

        dh.fingerprints = [fingerprint1, fingerprint2];
        return [dh];
      },
    };

    let deviceService = new DeviceService(
      mockDeviceDataStore as unknown as DeviceDataStore,
      {} as IntegrationRegistry
    );

    let deviceInfo = new Map<string, string>();
    deviceInfo.set("manufacturer", "CentraLite");
    deviceInfo.set("model", "3210-L");
    deviceInfo.set("profileId", "0104");
    deviceInfo.set("outClusters", "0019");
    deviceInfo.set(
      "inClusters",
      "0000,0003,0004,0005,0006,0702,0B04,0B05,FC03"
    );

    let deviceHandlerInfo =
      deviceService.getDeviceHandlerByFingerprint(deviceInfo);
    expect(deviceHandlerInfo).not.toBeNull();
    expect(deviceHandlerInfo.id).toBeDefined();
    expect(deviceHandlerInfo.joinName).toBe("Smartthings Outlet");
  });
});
