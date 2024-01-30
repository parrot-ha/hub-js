import { DeviceWrapper } from "../device/models/device-wrapper";
import { DataType } from "./data-type";
import {
  hexStringToInt,
  numberToHexString,
  reverseHexString,
} from "./hex-utils";
import { toInteger } from "./object-utils";

type AdditionalParamsType = {
  destEndpoint?: number | string;
  mfgCode?: number | string;
};

export class ZigBeeUtils {
  private _device: DeviceWrapper;

  private static DEFAULT_DELAY: number = 2000;

  constructor(device: DeviceWrapper) {
    this._device = device;
  }

  public parseDescriptionAsObject(description: string): any {
    let parsedDescription = this.parseDescriptionAsMap(description);
    if (parsedDescription) {
      return Object.fromEntries(parsedDescription);
    } else {
      return null;
    }
  }

  public parseDescriptionAsMap(description: string): Map<string, any> {
    if (description == null) {
      return null;
    }
    if (description.startsWith("read attr - ")) {
      let descriptionMap = new Map<string, any>();
      let descriptionArray = description
        .substring("read attr -".length)
        .split(",");

      for (let arrayItem of descriptionArray) {
        let keyValue = arrayItem.split(":");
        descriptionMap.set(keyValue[0].trim(), keyValue[1].trim());
      }

      // need to flip the value for some encodings:
      // 29 = Signed 16 bit integer
      // 21 = Unsigned 16-bit integer
      //TODO: figure out all encodings that need to be flipped
      if (
        "21" === descriptionMap.get("encoding") ||
        "29" === descriptionMap.get("encoding")
      ) {
        descriptionMap.set(
          "value",
          reverseHexString(descriptionMap.get("value"))
        );
      }

      descriptionMap.set(
        "clusterInt",
        parseInt(descriptionMap.get("cluster"), 16)
      );
      descriptionMap.set("attrInt", parseInt(descriptionMap.get("attrId"), 16));

      return descriptionMap;
    } else if (description.startsWith("catchall: ")) {
      let descriptionMap = new Map<string, any>();
      let rawDescription = description.substring("catchall: ".length);
      let descriptionArray = rawDescription.split(" ");
      descriptionMap.set("raw", rawDescription);
      descriptionMap.set("profileId", descriptionArray[0].trim());
      descriptionMap.set("clusterId", descriptionArray[1].trim());
      descriptionMap.set("sourceEndpoint", descriptionArray[2].trim());
      descriptionMap.set("destinationEndpoint", descriptionArray[3].trim());
      descriptionMap.set("options", descriptionArray[4].trim());
      descriptionMap.set("messageType", descriptionArray[5].trim());
      descriptionMap.set("dni", descriptionArray[6].trim());
      descriptionMap.set(
        "isClusterSpecific",
        descriptionArray[7].trim() === "01"
      );
      descriptionMap.set(
        "isManufacturerSpecific",
        descriptionArray[8].trim() === "01"
      );
      descriptionMap.set("manufacturerId", descriptionArray[9].trim());
      descriptionMap.set("command", descriptionArray[10].trim());
      descriptionMap.set("direction", descriptionArray[11].trim());
      if (descriptionArray.length > 12) {
        let dataList = descriptionArray[12].trim().split("(?<=\\G.{2})");
        descriptionMap.set("data", dataList);
      } else {
        descriptionMap.set("data", [] as Array<string>);
      }
      descriptionMap.set(
        "clusterInt",
        hexStringToInt(descriptionArray[1].trim())
      );
      descriptionMap.set(
        "commandInt",
        hexStringToInt(descriptionArray[10].trim())
      );

      return descriptionMap;
    } else {
      return null;
    }
  }

  public on(delay: number): Array<string> {
    return this.command(6, 1, "", {}, delay);
  }

  public off(delay: number): Array<string> {
    return this.command(6, 0, "", {}, delay);
  }

  public command(
    cluster: number,
    command: number,
    payload: string,
    additionalParams: AdditionalParamsType = {},
    delay: number = ZigBeeUtils.DEFAULT_DELAY
  ): Array<string> {
    let arrayList = new Array<string>();
    let endpointId = this._device.endpointId;
    if (additionalParams != null && additionalParams.destEndpoint != null) {
      endpointId = toInteger(additionalParams.destEndpoint);
    }

    let mfgCode = this.getMfgCode(additionalParams);
    arrayList.push(
      `ph cmd 0x${this._device.deviceNetworkId} 0x${numberToHexString(
        endpointId,
        1
      )} 0x${numberToHexString(cluster, 2)} 0x${numberToHexString(
        command,
        1
      )} {${payload != null ? payload : ""}} {${
        mfgCode > -1 ? numberToHexString(mfgCode, 2) : ""
      }}`
    );

    if (delay > 0) {
      arrayList.push("delay " + delay);
    }

    return arrayList;
  }

  public configureReporting(
    clusterId: number,
    attributeId: number,
    dataType: number,
    minReportTime: number,
    maxReportTime: number,
    reportableChange: number = null,
    additionalParams: AdditionalParamsType = {},
    delay: number = ZigBeeUtils.DEFAULT_DELAY
  ): Array<string> {
    let destEndpoint = 1;
    let arrayList: Array<string> = new Array<string>();
    arrayList.push(
      `zdo bind 0x${
        this._device.deviceNetworkId
      } 0x${this.getFormattedDeviceEndpoint()} 0x${numberToHexString(
        destEndpoint,
        1
      )} 0x${numberToHexString(clusterId, 2)} {${this._device.zigbeeId}} {}`
    );
    if (delay > 0) {
      arrayList.push("delay " + delay);
    }
    if (reportableChange != null && reportableChange < 1) {
      reportableChange = 1;
    }
    let mfgCodeNumber = this.getMfgCode(additionalParams);
    let mfgCode = mfgCodeNumber > -1 ? numberToHexString(mfgCodeNumber, 2) : "";

    if (additionalParams != null && additionalParams.mfgCode != null) {
      mfgCode = additionalParams.mfgCode.toString();
    }
    arrayList.push(
      `ph cr 0x${
        this._device.deviceNetworkId
      } 0x${this.getFormattedDeviceEndpoint()} 0x${numberToHexString(
        clusterId,
        2
      )} 0x${numberToHexString(attributeId, 2)} 0x${numberToHexString(
        dataType,
        1
      )} 0x${numberToHexString(minReportTime, 2)} 0x${numberToHexString(
        maxReportTime,
        2
      )} {${
        reportableChange != null
          ? DataType.pack(reportableChange, dataType)
          : ""
      }} {${mfgCode}}`
    );

    if (delay > 0) {
      arrayList.push("delay " + delay);
    }

    return arrayList;
  }

  public readAttribute(
    clusterId: number,
    attributeId: number,
    additionalParams: AdditionalParamsType = {},
    delay: number = ZigBeeUtils.DEFAULT_DELAY
  ): Array<string> {
    let arrayList = new Array<string>();

    let destEndpoint = this._device.endpointId;
    if (additionalParams?.destEndpoint != null) {
      destEndpoint = toInteger(additionalParams.destEndpoint);
    }

    let mfgCode = this.getMfgCode(additionalParams);

    if (mfgCode > -1) {
      arrayList.push(
        `ph rattr 0x${this._device.deviceNetworkId} 0x${numberToHexString(
          destEndpoint,
          1
        )} 0x${numberToHexString(clusterId, 2)} 0x${numberToHexString(
          attributeId,
          2
        )} {${mfgCode > -1 ? numberToHexString(mfgCode, 2) : ""}}`
      );
    } else {
      arrayList.push(
        `ph rattr 0x${this._device.deviceNetworkId} 0x${numberToHexString(
          destEndpoint,
          1
        )} 0x${numberToHexString(clusterId, 2)} 0x${numberToHexString(
          attributeId,
          2
        )}`
      );
    }

    if (delay > 0) {
      arrayList.push("delay " + delay);
    }

    return arrayList;
  }

  public writeAttribute(
    clusterId: number,
    attributeId: number,
    dataType: number,
    value: number | string,
    additionalParams: AdditionalParamsType = {},
    delay: number = ZigBeeUtils.DEFAULT_DELAY
  ): Array<string> {
    let arrayList = new Array<string>();

    let destEndpoint = this._device.endpointId;
    if (additionalParams?.destEndpoint != null) {
      destEndpoint = toInteger(additionalParams.destEndpoint);
    }

    let mfgCode = this.getMfgCode(additionalParams);

    // TODO: should this use DataType.pack() for the value instead?
    let stringValue: string;
    if (typeof value === "number") {
      stringValue = numberToHexString(value, 1);
    } else {
      stringValue = value.toString();
    }

    arrayList.push(
      `ph wattr 0x${this._device.deviceNetworkId} 0x${numberToHexString(
        destEndpoint,
        1
      )} 0x${numberToHexString(clusterId, 2)} 0x${numberToHexString(
        attributeId,
        2
      )} {${stringValue}} {${
        mfgCode > -1 ? numberToHexString(mfgCode, 2) : ""
      }}`
    );

    if (delay > 0) {
      arrayList.push("delay " + delay);
    }

    return arrayList;
  }

  // zigbee.levelConfig():
  // [zdo bind 0xFC6E 0x01 0x01 0x0008 {000D6F00055D8FA6} {}, delay 2000, st cr 0xFC6E 0x01 0x0008 0x0000 0x20 0x0001 0x0E10 {01}, delay 2000]
  //zigbee.levelConfig("ABC", "CDF","XYZ")
  //[zdo bind 0xFC6E 0x01 0x01 0x0008 {000D6F00055D8FA6} {}, delay 2000, st cr 0xFC6E 0x01 0x0008 0x0000 0x20 0x0ABC 0x0CDF {XYZ}, delay 2000]
  public levelConfig(
    minReportTime: number = 1,
    maxReportTime: number = 3600,
    reportableChange: number = 1,
    delay: number = ZigBeeUtils.DEFAULT_DELAY
  ): Array<string> {
    let arrayList = new Array<string>();
    arrayList.push(
      `zdo bind 0x${
        this._device.deviceNetworkId
      } 0x${this.getFormattedDeviceEndpoint()} 0x01 0x0008 {${
        this._device.zigbeeId
      }} {}`
    );
    if (delay > 0) {
      arrayList.push("delay " + delay);
    }
    if (reportableChange < 1) {
      reportableChange = 1;
    }
    arrayList.push(
      `ph cr 0x${
        this._device.deviceNetworkId
      } 0x${this.getFormattedDeviceEndpoint()} 0x0008 0x0000 0x20 0x${numberToHexString(
        minReportTime,
        2
      )} 0x${numberToHexString(maxReportTime, 2)} {${
        reportableChange != null ? DataType.pack(reportableChange, 0x20) : ""
      }}`
    );

    if (delay > 0) {
      arrayList.push("delay " + delay);
    }

    return arrayList;
  }

  public setLevel(
    level: number,
    rate: number = 0xffff,
    delay: number = ZigBeeUtils.DEFAULT_DELAY
  ): Array<string> {
    let arrayList = new Array<string>();
    // level is 0 - 254
    if (level > 100) {
      level = 100;
    } else if (level < 0) {
      level = 0;
    }
    level = Math.round((level / 100.0) * 254.0);
    if (rate < 0) {
      rate = 0;
    }
    if (rate > 100 && rate != 0xffff) {
      rate = 100;
    }

    arrayList.push(
      `ph cmd 0x${
        this._device.deviceNetworkId
      } 0x${this.getFormattedDeviceEndpoint()} 0x0008 0x04 {${numberToHexString(
        level,
        1
      )} ${DataType.pack(rate, DataType.UINT16, true)}}`
    );
    if (delay > 0) {
      arrayList.push("delay " + delay);
    }
    return arrayList;
  }

  private getMfgCode(additionalParams: AdditionalParamsType): number {
    if (additionalParams?.mfgCode != null) {
      return toInteger(additionalParams.mfgCode);
    }
    return -1;
  }

  private getFormattedDeviceEndpoint(): string {
    return numberToHexString(this._device.endpointId, 1);
  }
}
