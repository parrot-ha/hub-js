import { ZclPayload } from "zigbee-herdsman/dist/adapter/events";
import {
  numberArrayToHexString,
  numberToHexString,
  reverseHexString,
} from "../utils/hex-utils";
import { DataType } from "../utils/data-type";

export function parse(payload: ZclPayload): [string, string] {
  if (
    payload.header.frameControl.frameType == 0 &&
    (payload.header.commandIdentifier == 0x01 ||
      payload.header.commandIdentifier == 0x0a)
  ) {
    let command = numberToHexString(
      payload.header.commandIdentifier,
      1
    ).toUpperCase();
    let dni =
      typeof payload.address === "string"
        ? payload.address
        : numberToHexString(payload.address, 2).toUpperCase();
    let endpoint = numberToHexString(payload.endpoint, 1).toUpperCase();
    let clusterId = numberToHexString(payload.clusterID, 2).toUpperCase();
    let isManufacturerSpecific =
      payload.header.frameControl.manufacturerSpecific;

    let dataLoc = isManufacturerSpecific ? 5 : 3;

    let dataArr = [...payload.data];

    // calculate size
    let size = numberToHexString(
      (dataArr.length - dataLoc) * 2,
      1
    ).toUpperCase();

    //TODO: is reverse the correct parsing?
    let attributeId =
      numberToHexString(dataArr[dataLoc + 1], 1).toUpperCase() +
      numberToHexString(dataArr[dataLoc], 1).toUpperCase();

    dataLoc += 2;
    let status = 0;
    if (command == "01") {
      status = dataArr[dataLoc++];
    }
    if (status != 0) {
      //build catchall
      return createCatchAllMessageWithPreParsedData(
        payload,
        clusterId,
        endpoint,
        dni,
        command,
        numberArrayToHexString(dataArr.slice(dataLoc - 3)).toUpperCase()
      );
    }

    let encoding = dataArr[dataLoc];
    let value = numberArrayToHexString(
      dataArr.slice(dataLoc + 1)
    ).toUpperCase();
    let dataTypeSize = DataType.getLength(encoding);

    let msgStr =
      "read attr - raw: " +
      dni +
      endpoint +
      clusterId +
      size +
      reverseHexString(attributeId) +
      numberToHexString(encoding, 1).toUpperCase() +
      // TODO: check data type to see if its a number or not
      value +
      ", dni: " +
      dni +
      ", endpoint: " +
      endpoint +
      ", cluster: " +
      clusterId +
      ", size: " +
      size +
      ", attrId: " +
      attributeId +
      ", encoding: " +
      numberToHexString(encoding, 1).toUpperCase() +
      ", command: " +
      command +
      ", value: " +
      // TODO: check data type to see if its a number or not
      value;

    return [dni, msgStr];
  } else {
    return createCatchAllMessage(payload);
  }
}

// return a catch all
// Smartthings format:
// catchall: 0104 0006 01 01 0040 00 2A7F 00 00 0000 0B 01 0000
// catchall: 0104        0006         01               01                    0040        00            3F21  00                   00                       0000               0B         01             0000
//           [profileId] [clusterId] [sourceEndpoint] [destinationEndpoint] [options]   [messageType] [dni] [isClusterSpecific]  [isManufacturerSpecific]  [manufacturerId]  [command]  [direction]    [data]
// Our format is going to be slightly different. Since we support more than just ember, some fields don't make sense here.
// catchall: 0006         01               01                    3F21  00                   00                       0000               0B         01             0000
//           [clusterId] [sourceEndpoint] [destinationEndpoint] [dni] [isClusterSpecific]  [isManufacturerSpecific]  [manufacturerId]  [command]  [direction]    [data]
// should we add group information?
function createCatchAllMessage(payload: ZclPayload): [string, string] {
  return createCatchAllMessageWithPreParsedData(
    payload,
    numberToHexString(payload.clusterID, 2).toUpperCase(),
    numberToHexString(payload.endpoint, 1).toUpperCase(),
    typeof payload.address === "string"
      ? payload.address
      : numberToHexString(payload.address, 2).toUpperCase(),
    numberToHexString(payload.header.commandIdentifier, 1).toUpperCase(),
    numberArrayToHexString(
      [...payload.data].slice(
        payload.header.frameControl.manufacturerSpecific ? 5 : 3
      )
    ).toUpperCase()
  );
}

function createCatchAllMessageWithPreParsedData(
  payload: ZclPayload,
  clusterId: string,
  sourceEndpoint: string,
  dni: string,
  command: string,
  data: string
): [string, string] {
  let destEndpoint = numberToHexString(
    payload.destinationEndpoint,
    1
  ).toUpperCase();
  let msgStr =
    "catchall: " + // TODO: can we get the actual profile instead of hard coding it.
    clusterId +
    " " +
    sourceEndpoint +
    " " +
    destEndpoint +
    " " +
    dni +
    " " +
    numberToHexString(payload.header.frameControl.frameType, 1).toUpperCase() +
    (payload.header.frameControl.manufacturerSpecific ? " 01 " : " 00 ") +
    (payload.header.manufacturerCode == null
      ? "0000"
      : numberToHexString(payload.header.manufacturerCode, 2).toUpperCase()) +
    " " +
    command +
    " " +
    numberToHexString(payload.header.frameControl.direction, 1).toUpperCase() +
    " " +
    data;

  return [dni, msgStr];
}
