import { deleteWhitespace, isNotEmpty, stringToObject } from "../utils/string-utils";
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
    msg.startsWith("zh cmd")
  ) {
    if (logger.isDebugEnabled()) {
      logger.debug("Sending cmd! " + msg);
    }
    msg = msg.substring("zh cmd ".length);
    let msgParts = msg.split(" ");

    let networkAddress = getIntegerValueForString(msgParts[0].trim());
    let endpointInt = getIntegerValueForString(msgParts[1].trim());
    let cluster = getIntegerValueForString(msgParts[2].trim());
    let command = msgParts[3].trim();
    let payloadStr = extractPayload(msg);
    let manufacturer = extractManufacturerCode(msg);

    let zbDevice: ZigbeeDevice =
      controller.getDeviceByNetworkAddress(networkAddress);
    let endpoint: Endpoint = zbDevice.getEndpoint(endpointInt);

    let options: { manufacturerCode?: number } = {};
    if (manufacturer != null) {
      options.manufacturerCode = manufacturer;
    }
    let payload = stringToObject(payloadStr, ",", ":", false);
    logger.debug(JSON.stringify(payload));
    endpoint.command(cluster, command, payload, options);
  }
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
      for (
        let payloadIndex = 0;
        payloadIndex < payloadArr.length;
        payloadIndex++
      ) {
        let valueName = "value";
        if (payloadIndex > 0) {
          valueName = valueName + (payloadIndex + 1);
        }
        payload[valueName] = payloadArr[payloadIndex];
      }
    }

    let options: { manufacturerCode?: number } = {};
    if (manufacturer != null) {
      options.manufacturerCode = manufacturer;
    }

    endpoint
      .command(cluster, command, payload, options)
      .then(() => {})
      .catch((err) => {
        logger.warn("error with endpoint command", err);
      });
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

    endpoint
      .read(cluster, [attribute], options)
      .then((data) => {})
      .catch((err) => {
        logger.warn("error with endpoint read", err);
      });
  } else if (
    msg.startsWith("ph cr ") ||
    msg.startsWith("st cr ") ||
    msg.startsWith("he cr ")
  ) {
    msg = msg.substring("ph cr ".length);
    let msgParts = msg.split(" ");
    let networkAddress = getIntegerValueForString(msgParts[0].trim());
    let endpointInt = getIntegerValueForString(msgParts[1].trim());
    let cluster = getIntegerValueForString(msgParts[2].trim());
    let attributeId = getIntegerValueForString(msgParts[3].trim());
    let attributeDataType = getIntegerValueForString(msgParts[4].trim());
    let minInterval = getIntegerValueForString(msgParts[5].trim());
    let maxInterval = getIntegerValueForString(msgParts[6].trim());

    let zbDevice: ZigbeeDevice =
      controller.getDeviceByNetworkAddress(networkAddress);
    let endpoint: Endpoint = zbDevice.getEndpoint(endpointInt);

    let configureReportingItem = {
      attribute: { ID: attributeId, type: attributeDataType },
      minimumReportInterval: minInterval,
      maximumReportInterval: maxInterval,
      reportableChange: 0,
    };

    let reportableChangeString = deleteWhitespace(
      msg.substring(msg.indexOf("{") + 1, msg.indexOf("}"))
    );
    if (isNotEmpty(reportableChangeString)) {
      //TODO: look at data type to determine if it is little endian
      configureReportingItem.reportableChange = getIntegerValueForString(
        "0x" + reportableChangeString,
        true
      );
    }

    let mfgCode = extractManufacturerCode(msg);
    let options: { manufacturerCode?: number } = {};
    if (mfgCode != null) {
      options.manufacturerCode = mfgCode;
    }

    endpoint
      .configureReporting(cluster, [configureReportingItem], options)
      .then(() => {})
      .catch((err) => {
        logger.warn("error with endpoint configure reporting", err);
      });
  } else if (msg.startsWith("zdo bind")) {
    // do a bind message
    msg = msg.substring("zdo bind ".length);
    let msgParts = msg.split(" ");
    let networkAddress = hexStringToInt(msgParts[0].trim());
    let endpointInt = hexStringToInt(msgParts[1].trim());
    let destEndpoint = hexStringToInt(msgParts[2].trim());
    let cluster = hexStringToInt(msgParts[3].trim());

    let zbDevice: ZigbeeDevice =
      controller.getDeviceByNetworkAddress(networkAddress);
    let endpoint: Endpoint = zbDevice.getEndpoint(endpointInt);

    let coordinatorDeviceArray = controller.getDevicesByType("Coordinator");
    if (coordinatorDeviceArray != null && coordinatorDeviceArray.length > 0) {
      let coordinatorDevice = coordinatorDeviceArray[0] as ZigbeeDevice;
      endpoint
        .bind(cluster, coordinatorDevice.getEndpoint(destEndpoint))
        .then(() => {})
        .catch((err) => {
          logger.warn("error with endpoint bind", err);
        });
    }
  } else {
    logger.warn("Unknown message: " + msg);
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
      if (isNotEmpty(manufacturer)) return hexStringToInt(manufacturer);
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
