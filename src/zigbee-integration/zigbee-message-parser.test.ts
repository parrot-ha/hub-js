import { describe, expect, test } from "@jest/globals";
import { parse } from "./zigbee-message-parser";
import { ZclPayload } from "zigbee-herdsman/dist/adapter/events";

describe("test process attribute report", () => {
  test("test attribute report switch off", async () => {
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

    let [dni, msg] = parse(zclPayload as ZclPayload);

    expect(msg).toBe(
      "read attr - raw: D5ED0100060A00001000, dni: D5ED, endpoint: 01, cluster: 0006, size: 0A, attrId: 0000, encoding: 10, command: 01, value: 00"
    );
  });

  test("test attribute report 0x201", async () => {
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

    let [dni, msg] = parse(zclPayload as ZclPayload);
    expect(msg).toBe(
      "read attr - raw: 1B840102011C2300300024002100000201210000, dni: 1B84, endpoint: 01, cluster: 0201, size: 1C, attrId: 0023, encoding: 30, command: 0A, value: 0024002100000201210000"
    );
  });

  test("test attribute report 0x201", async () => {
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

    let [dni, msg] = parse(zclPayload as ZclPayload);
    expect(msg).toBe(
      "read attr - raw: 1B840102010800013002, dni: 1B84, endpoint: 01, cluster: 0201, size: 08, attrId: 0100, encoding: 30, command: 0A, value: 02"
    );
  });

  test("test catch all response", async () => {
    let zclPayload = {
      clusterID: 6,
      data: Buffer.from([0x08, 0x08, 0x0b, 0x00, 0x00]),
      header: {
        frameControl: {
          frameType: 0,
          manufacturerSpecific: false,
          direction: 1,
          disableDefaultResponse: false,
          reservedBits: 0,
        },
        manufacturerCode: null,
        transactionSequenceNumber: 8,
        commandIdentifier: 11,
      },
      address: 0xe6a2,
      endpoint: 1,
      linkquality: 198,
      groupID: 0,
      wasBroadcast: false,
      destinationEndpoint: 1,
    };

    let [dni, msg] = parse(zclPayload as ZclPayload);
    expect(msg).toBe("catchall: 0006 01 01 E6A2 00 00 0000 0B 01 0000");
  });

  test("test read attribute response with unsupported attribute status", async () => {
    let zclPayload = {
      clusterID: 33,
      data: Buffer.from([0x18, 0x25, 0x01, 0x21, 0x00, 0x86]),
      header: {
        frameControl: {
          frameType: 0,
          manufacturerSpecific: false,
          direction: 1,
          disableDefaultResponse: true,
          reservedBits: 0,
        },
        manufacturerCode: null,
        transactionSequenceNumber: 37,
        commandIdentifier: 1,
      },
      address: 0x9750,
      endpoint: 1,
      linkquality: 198,
      groupID: 0,
      wasBroadcast: false,
      destinationEndpoint: 1,
    };

    let [dni, msg] = parse(zclPayload as ZclPayload);
    expect(msg).toBe("catchall: 0021 01 01 9750 00 00 0000 01 01 210086");
  });

  test("test cluster specific frame", async () => {
    let zclPayload = {
      clusterID: 257,
      data: Buffer.from([0x19, 0x17, 0x01, 0x00]),
      header: {
        frameControl: {
          frameType: 1,
          manufacturerSpecific: false,
          direction: 1,
          disableDefaultResponse: true,
          reservedBits: 0,
        },
        manufacturerCode: null,
        transactionSequenceNumber: 23,
        commandIdentifier: 1,
      },
      address: 0x5c36,
      endpoint: 1,
      linkquality: 198,
      groupID: 0,
      wasBroadcast: false,
      destinationEndpoint: 1,
    };

    let [dni, msg] = parse(zclPayload as ZclPayload);
    expect(msg).toBe("catchall: 0101 01 01 5C36 01 00 0000 01 01 00");
  });
});
