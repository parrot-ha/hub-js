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
      //TODO: build catchall
      console.log("need to build catchall");
    }

    let encoding = dataArr[dataLoc];
    let value = numberArrayToHexString(
      dataArr.slice(dataLoc + 1)
    ).toUpperCase();
    let dataTypeSize = DataType.getLength(encoding);
    // let dataTypeSize = 1;

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
  }
}

function createCatchAllMessage(payload: ZclPayload): [string, string] {

    return [null, null];
}
