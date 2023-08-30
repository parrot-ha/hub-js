import { deleteWhitespace } from "../utils/string-utils";
import {
  hexStringToInt,
  hexStringToNumberArray,
  reverseHexString,
} from "../utils/hex-utils";
import {
  Endpoint,
  Device as ZigbeeDevice,
} from "zigbee-herdsman/dist/controller/model";

const logger = require("../hub/logger-service")({
  source: "ZigbeeMessageTransformer",
});

export function sendZigbeeMessage(msg: string, controller: any) {
  if (
    msg.startsWith("ph cmd") ||
    msg.startsWith("st cmd") ||
    msg.startsWith("he cmd")
  ) {
    if (logger.isDebugEnabled()) {
      logger.debug("Sending cmd! " + msg);
    }
    msg = msg.substring("ph cmd ".length);
    let msgParts = msg.split(" ");

    let networkAddress = getIntegerValueForString(msgParts[0].trim());
    let endpointInt = getIntegerValueForString(msgParts[1].trim());
    let cluster = getIntegerValueForString(msgParts[2].trim());
    let command = getIntegerValueForString(msgParts[3].trim());
    let payloadStr = extractPayload(msg);
    let manufacturer = extractManufacturerCode(msg);

    let zbDevice: ZigbeeDevice =
      controller.getDeviceByNetworkAddress(networkAddress);
    let endpoint: Endpoint = zbDevice.getEndpoint(endpointInt);

    let payload: any = {};
    if (payloadStr != null && payloadStr.length > 0) {
      let payloadArr = hexStringToNumberArray(payloadStr);
      //set value, value2, value3 etc
      for(let payloadIndex = 0; payloadIndex < payloadArr.length; payloadIndex++) {
        let valueName = "value"
        if(payloadIndex > 0) {
          valueName = valueName + (payloadIndex + 1);
        }
        payload[valueName] = payloadArr[payloadIndex];
      }
    }

    let options: { manufacturerCode?: number } = {};
    if (manufacturer != null) {
      options.manufacturerCode = manufacturer;
    }

    endpoint.command(cluster, command, payload, options);
  } else if (
    msg.startsWith("ph rattr") ||
    msg.startsWith("st rattr") ||
    msg.startsWith("he rattr")
  ) {
    msg = msg.substring("ph rattr ".length);
    let msgParts = msg.split(" ");
    let networkAddress = getIntegerValueForString(msgParts[0].trim());
    let endpointInt = getIntegerValueForString(msgParts[1].trim());
    let cluster = getIntegerValueForString(msgParts[2].trim());
    let attribute = getIntegerValueForString(msgParts[3].trim());
    let manufacturer = extractManufacturerCode(msg);

    let zbDevice: ZigbeeDevice =
      controller.getDeviceByNetworkAddress(networkAddress);
    let endpoint: Endpoint = zbDevice.getEndpoint(endpointInt);

    let options: { manufacturerCode?: number } = {};
    if (manufacturer != null) {
      options.manufacturerCode = manufacturer;
    }
    endpoint.read(cluster, [attribute], options);
  }
}

function getIntegerValueForString(
  valueStr: string,
  littleEndian: boolean = false
): number {
  if (valueStr.startsWith("0x")) {
    if (littleEndian) {
      return hexStringToInt(reverseHexString(valueStr.substring(2)));
    } else {
      return hexStringToInt(valueStr);
    }
  } else {
    return parseInt(valueStr);
  }
}

function extractManufacturerCode(msg: string): number {
  if (msg.length > msg.indexOf("}") + 1) {
    let additionalMsg = msg.substring(msg.indexOf("}") + 1);
    if (additionalMsg.indexOf("{") > -1) {
      let manufacturer = deleteWhitespace(
        additionalMsg.substring(
          additionalMsg.indexOf("{") + 1,
          additionalMsg.indexOf("}")
        )
      );
      return hexStringToInt(manufacturer);
    }
  }
  return null;
}

function extractPayload(msg: string): string {
  if (msg.indexOf("{") > -1) {
    return deleteWhitespace(
      msg.substring(msg.indexOf("{") + 1, msg.indexOf("}"))
    );
  }
  return null;
}
