import { describe, expect, test } from "@jest/globals";
import ZigbeeIntegration from "./zigbee-integration";
import { IntegrationService } from "../integration/integration-service";
import { getHomeDir } from "../utils/file-utils";
import fs from "fs";

var messageFunc: any = null;
var zclpFunc: any = null;
const mockTestFunc = jest.fn(() => console.log("testFunc!"));
const mockSendEvent = jest.fn((event: any) => console.log("Send Event called"));

let getIntegrationConfigurationValueMock = jest.fn(
  (integrationId, configurationId) => {
    if (configurationId == "serialPortName") return "fakeSerial";
    return "";
  },
);

let integrationService = {
  _integrationDataStore: null,
  _integrationRegistry: null,
  _entityService: null,
  _deviceService: null,
  _integrationMap: null,
  _integrationTypeMap: null,
  _protocolListMap: null,
  getIntegrationTypes: jest.fn(),
  getIntegrationTypeMap: jest.fn(),
  initialize: jest.fn(),
  shutdown: jest.fn(),
  eventReceived: jest.fn(),
  isResetIntegrationExtension: jest.fn(),
  isDeviceScanIntegrationExtension: jest.fn(),
  lanDeviceMessageReceived: jest.fn(),
  loadIntegrationTypes: jest.fn(),
  getIntegrationMap: jest.fn(),
  loadIntegrationMap: jest.fn(),
  getIntegrationById: jest.fn(),
  getAbstractIntegrationByTypeId: jest.fn(),
  getAbstractIntegrationFromConfiguration: jest.fn(),
  createIntegration: jest.fn(),
  removeIntegration: jest.fn(),
  initializeIntegration: jest.fn(),
  getIntegrationSettings: jest.fn(),
  updateIntegrationSettings: jest.fn(),
  addIntegrationConfiguration: jest.fn(),
  getIntegrationConfigurationById: jest.fn(),
  getIntegrationConfigurationValue: getIntegrationConfigurationValueMock,
  updateIntegrationSettingValue: jest.fn(),
};

jest.mock("zigbee-herdsman", () => {
  return {
    Controller: jest.fn().mockImplementation((options: any) => {
      console.log("constructor!");
      return {
        testFunc: mockTestFunc,
        on: jest.fn((name, mthd) => {
          console.log("called on with name", name, mthd);
          if (name === "message") {
            console.log("setting message func");
            messageFunc = mthd;
          }
        }),
        start: jest.fn(() => new Promise((resolve) => resolve(true))),
        getNetworkParameters: jest.fn(
          () => new Promise((resolve) => resolve({ panID: 58 })),
        ),
        backup: jest.fn(),
        adapter: {
          on: jest.fn((name, mthd) => {
            console.log("called adapter on with name", name, mthd);
            if (name == "zclPayload") {
              console.log("setting zclpayload func");
              zclpFunc = mthd;
            }
          }),
        },
      };
    }),
    setLogger: jest.fn(),
  };
});

let deleteUserDir = false;

afterAll(() => {
  if (deleteUserDir) {
    fs.rmdirSync(`${getHomeDir()}`, { recursive: true });
  }
});

beforeAll(() => {
  if (!fs.existsSync(getHomeDir())) {
    deleteUserDir = true;
    fs.mkdirSync(getHomeDir());
  }
  expect(messageFunc).toBeNull();
  expect(zclpFunc).toBeNull();

  console.log("create new zigbee integration");

  let zbInt = new ZigbeeIntegration();
  zbInt.integrationService =
    integrationService as unknown as IntegrationService;
  zbInt.start();
  zbInt.sendEvent = mockSendEvent;
  console.log("after start");

  expect(messageFunc).toBeDefined();
  expect(zclpFunc).toBeDefined();
});

describe("test process attribute report", () => {
  test("test attribute report switch off", async () => {
    mockSendEvent.mockClear();

    let zclPayload = {
      clusterID: 6,
      data: Buffer.from([24, 2, 1, 0, 0, 0, 16, 0]),
      header: {
        frameControl: {
          frameType: 0,
          manufacturerSpecific: false,
          direction: 1,
          disableDefaultResponse: true,
          reservedBits: 0,
        },
        manufacturerCode: null,
        transactionSequenceNumber: 2,
        commandIdentifier: 1,
      },
      address: 54765,
      endpoint: 1,
      linkquality: 198,
      groupID: 0,
      wasBroadcast: false,
      destinationEndpoint: 1,
    };

    await new Promise((r) => setTimeout(r, 500));

    zclpFunc(zclPayload);
    expect(mockSendEvent).toHaveBeenCalledTimes(1);
    expect(mockSendEvent.mock.calls[0][0]).toBeDefined();
    expect(mockSendEvent.mock.calls[0][0].message).toBeDefined();
    expect(mockSendEvent.mock.calls[0][0].message).toBe(
      "read attr - raw: D5ED0100060A00001000, dni: D5ED, endpoint: 01, cluster: 0006, size: 0A, attrId: 0000, encoding: 10, command: 01, value: 00",
    );

    await new Promise((r) => setTimeout(r, 1000));
  });

  test("test attribute report 0x201", async () => {
    mockSendEvent.mockClear();

    let zclPayload = {
      clusterID: 513,
      data: Buffer.from([
        0x1c, 0x39, 0x10, 0xbc, 0x0a, 0x23, 0x00, 0x30, 0x00, 0x24, 0x00, 0x21,
        0x00, 0x00, 0x02, 0x01, 0x21, 0x00, 0x00,
      ]),
      header: {
        frameControl: {
          frameType: 0,
          manufacturerSpecific: true,
          direction: 1,
          disableDefaultResponse: true,
          reservedBits: 0,
        },
        manufacturerCode: 4153,
        transactionSequenceNumber: 188,
        commandIdentifier: 10,
      },
      address: 7044,
      endpoint: 1,
      linkquality: 198,
      groupID: 0,
      wasBroadcast: false,
      destinationEndpoint: 1,
    };

    await new Promise((r) => setTimeout(r, 500));

    zclpFunc(zclPayload);
    expect(mockSendEvent).toHaveBeenCalledTimes(1);
    expect(mockSendEvent.mock.calls[0][0]).toBeDefined();
    expect(mockSendEvent.mock.calls[0][0].message).toBeDefined();
    expect(mockSendEvent.mock.calls[0][0].message).toBe(
      "read attr - raw: 1B840102011C2300300024002100000201210000, dni: 1B84, endpoint: 01, cluster: 0201, size: 1C, attrId: 0023, encoding: 30, command: 0A, value: 0024002100000201210000",
    );

    await new Promise((r) => setTimeout(r, 1000));
  });

  test("test attribute report 0x201", async () => {
    mockSendEvent.mockClear();

    let zclPayload = {
      clusterID: 513,
      data: Buffer.from([0x1c, 0x39, 0x10, 0xbd, 0x0a, 0x00, 0x01, 0x30, 0x02]),
      header: {
        frameControl: {
          frameType: 0,
          manufacturerSpecific: true,
          direction: 1,
          disableDefaultResponse: true,
          reservedBits: 0,
        },
        manufacturerCode: 4153,
        transactionSequenceNumber: 188,
        commandIdentifier: 10,
      },
      address: 7044,
      endpoint: 1,
      linkquality: 198,
      groupID: 0,
      wasBroadcast: false,
      destinationEndpoint: 1,
    };

    await new Promise((r) => setTimeout(r, 500));

    zclpFunc(zclPayload);
    expect(mockSendEvent).toHaveBeenCalledTimes(1);
    expect(mockSendEvent.mock.calls[0][0]).toBeDefined();
    expect(mockSendEvent.mock.calls[0][0].message).toBeDefined();
    expect(mockSendEvent.mock.calls[0][0].message).toBe(
      "read attr - raw: 1B840102010800013002, dni: 1B84, endpoint: 01, cluster: 0201, size: 08, attrId: 0100, encoding: 30, command: 0A, value: 02",
    );

    await new Promise((r) => setTimeout(r, 1000));
  });
});
