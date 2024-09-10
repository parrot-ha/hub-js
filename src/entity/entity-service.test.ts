import { describe, expect, test } from "@jest/globals";
import { EntityService } from "./entity-service";
import { DeviceService } from "../device/device-service";
import { SmartAppService } from "../smartApp/smart-app-service";
import { EventService } from "../hub/event-service";
import { LocationService } from "../hub/location-service";
import { DeviceWrapper } from "../device/models/device-wrapper";
import { Device } from "../device/models/device";
import { Subscription } from "./models/subscription";

describe("process events", () => {
  test("two events with first event throwing error", () => {
    const mockRunSmartAppMethod = jest.fn();
    mockRunSmartAppMethod.mockImplementation((appId, method, event) => {
      console.log("mock! " + appId);
      if (appId == "app1") {
        throw new Error();
      } else {
        return new Promise((res) => res(true));
      }
    });

    let eventService = {
      getSubscribedSmartApps: jest.fn((event) => {
        let sub1 = Object.assign(new Subscription(), {
          subscribedAppId: "app1",
          handlerMethod: "method1",
        });
        let sub2 = Object.assign(new Subscription(), {
          subscribedAppId: "app2",
          handlerMethod: "method2",
        });
        return [sub1, sub2];
      }),
      saveEvent: jest.fn(),
    };
    let deviceService = {
      updateDeviceState: jest.fn(),
    };

    let entityService = new EntityService(
      deviceService as unknown as DeviceService,
      null as unknown as SmartAppService,
      eventService as unknown as EventService,
      null as unknown as LocationService,
    );
    entityService.runSmartAppMethod = mockRunSmartAppMethod.bind(entityService);

    let deviceWrapper = new DeviceWrapper(
      Object.assign(new Device(), { id: "1", name: "Test Device" }),
      null as unknown as DeviceService,
    );

    entityService.sendDeviceEvent(
      { name: "switch", value: "on" },
      deviceWrapper,
    );

    expect(mockRunSmartAppMethod.mock.calls).toHaveLength(2);
  });
});

describe("run smart app method", () => {
  test("run smart app method with id that doesn't exist", () => {
    let smartAppService = {
      getInstalledSmartApp: jest.fn().mockReturnValue(null),
    } as unknown as SmartAppService;

    let entityService = new EntityService(
      null as unknown as DeviceService,
      smartAppService,
      null as unknown as EventService,
      null as unknown as LocationService,
    );

    return expect(
      entityService.runSmartAppMethod("1", "test", []),
    ).rejects.toBeDefined();
  });
});
