import { describe, expect, test } from "@jest/globals";
import { EntityService } from "./entity-service";
import { DeviceService } from "../device/device-service";
import { SmartAppService } from "../smartApp/smart-app-service";
import { EventService } from "../hub/event-service";
import { LocationService } from "../hub/location-service";
import { DeviceHandler } from "../device/models/device-handler";
import { Fingerprint } from "../device/models/fingerprint";

describe("get Device Handler By Fingerprint", () => {
  test("empty device info", () => {
    let mockGetDeviceHandlers = jest.fn(() => []);
    let mockDeviceService = {
      getDeviceHandlers: function () {
        return [];
      },
      getDeviceHandlerByNameAndNamespace: function () {
        let dh = new DeviceHandler();
        dh.id = "789";
        return dh;
      },
    };

    let entityService = new EntityService(
      mockDeviceService as unknown as DeviceService,
      {} as SmartAppService,
      {} as EventService,
      {} as LocationService
    );
    
    let deviceHandlerInfo = entityService.getDeviceHandlerByFingerprint(
      new Map<string, string>()
    );
    expect(deviceHandlerInfo).not.toBeNull();
    expect(deviceHandlerInfo.id).toBe("789");
    expect(deviceHandlerInfo.joinName).toBe("Unknown Device");
  });

  test("single fingerprint matches device info", () => {
    let mockGetDeviceHandlers = jest.fn(() => []);
    let mockDeviceService = {
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
      getDeviceHandlerByNameAndNamespace: function () {
        let dh = new DeviceHandler();
        dh.id = "123";
        return dh;
      },
    };

    let entityService = new EntityService(
      mockDeviceService as unknown as DeviceService,
      {} as SmartAppService,
      {} as EventService,
      {} as LocationService
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
      entityService.getDeviceHandlerByFingerprint(deviceInfo);
    expect(deviceHandlerInfo).not.toBeNull();
    expect(deviceHandlerInfo.id).toBeDefined();
    expect(deviceHandlerInfo.joinName).toBe("Smartthings Outlet");
  });
});
