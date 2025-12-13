import { describe, expect, test } from "@jest/globals";
import { sendZigbeeMessage } from "./zigbee-message-transformer";

describe("test send zigbee message", () => {
  test("test send configure report", () => {
    let configureReportingMock = jest.fn(
      (clusterKey, items, options) => new Promise((res) => res(null))
    );
    let getEndpointMock = jest.fn((endpoint) => {
      return { configureReporting: configureReportingMock };
    });
    let getDeviceByNetworkAddressMock = jest.fn((networkAddress) => {
      return {
        getEndpoint: getEndpointMock,
      };
    });
    let controller = {
      getDeviceByNetworkAddress: getDeviceByNetworkAddressMock,
    };

    sendZigbeeMessage(
      "ph cr 0x1234 0x01 0x0402 0x0000 0x29 0x000a 0xa8c0 {3200} {}",
      controller
    );
    expect(getDeviceByNetworkAddressMock).toHaveBeenCalledTimes(1);
    expect(getDeviceByNetworkAddressMock.mock.calls[0][0]).toBe(0x1234);
    expect(getEndpointMock).toHaveBeenCalledTimes(1);
    expect(getEndpointMock.mock.calls[0][0]).toBe(1);
    // expect 1 call to configureReporting
    expect(configureReportingMock).toHaveBeenCalledTimes(1);
    //expect first param to be cluster
    expect(configureReportingMock.mock.calls[0][0]).toBe(0x0402);
    // param2
    let crParam2 = configureReportingMock.mock.calls[0][1];
    expect(crParam2).toHaveLength(1);
    expect(crParam2[0]).toBeDefined();
    expect(crParam2[0].attribute).toBeDefined();
    expect(crParam2[0].attribute.ID).toBe(0x0000);
    expect(crParam2[0].attribute.type).toBe(0x29);
    expect(crParam2[0].minimumReportInterval).toBe(0x000a);
    expect(crParam2[0].maximumReportInterval).toBe(0xa8c0);
    expect(crParam2[0].reportableChange).toBe(0x0032);

    // expect 3rd param to be an empty object
    expect(typeof configureReportingMock.mock.calls[0][2]).toBe("object");
    expect(Object.keys(configureReportingMock.mock.calls[0][2]).length).toBe(0);
  });
});
