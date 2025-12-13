import { DeviceWrapper } from "../device/models/device-wrapper";
import { DataType } from "../utils/data-type";
import {
  hexStringToInt,
  numberToHexString,
  reverseHexString,
} from "../utils/hex-utils";
import { toInteger } from "../utils/object-utils";
import { isEmpty } from "../utils/string-utils";
import { ZoneStatus } from "./zigbee-zone-status";

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

  public convertToHexString(value: number, length: number): string {
    return numberToHexString(value, length);
  }

  public swapEndianHex(hexString: string): string {
    return reverseHexString(hexString);
  }

  public parseZoneStatus(description: string): ZoneStatus {
    // example: zone status 0x0000 -- extended status 0x00
    let zoneStatusArray: string[] = description.split("--");
    for (let zoneStatus of zoneStatusArray) {
      if (zoneStatus.trim().startsWith("zone status ")) {
        return new ZoneStatus(
          hexStringToInt(zoneStatus.trim().substring("zone status ".length))
        );
      }
    }
    return null;
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
      // descriptionMap.set("profileId", descriptionArray[0].trim());
      descriptionMap.set("clusterId", descriptionArray[0].trim());
      descriptionMap.set("sourceEndpoint", descriptionArray[1].trim());
      descriptionMap.set("destinationEndpoint", descriptionArray[2].trim());
      // descriptionMap.set("options", descriptionArray[4].trim());
      // descriptionMap.set("messageType", descriptionArray[5].trim());
      descriptionMap.set("dni", descriptionArray[3].trim());
      descriptionMap.set(
        "isClusterSpecific",
        descriptionArray[4].trim() === "01"
      );
      descriptionMap.set(
        "isManufacturerSpecific",
        descriptionArray[5].trim() === "01"
      );
      descriptionMap.set("manufacturerId", descriptionArray[6].trim());
      descriptionMap.set("command", descriptionArray[7].trim());
      descriptionMap.set("direction", descriptionArray[8].trim());
      if (descriptionArray.length > 9) {
        let dataList = descriptionArray[9].trim().split("(?<=\\G.{2})");
        descriptionMap.set("data", dataList);
      } else {
        descriptionMap.set("data", [] as Array<string>);
      }
      descriptionMap.set(
        "clusterInt",
        hexStringToInt(descriptionArray[0].trim())
      );
      descriptionMap.set(
        "commandInt",
        hexStringToInt(descriptionArray[7].trim())
      );

      return descriptionMap;
    } else {
      return null;
    }
  }

  //https://docs.smartthings.com/en/latest/ref-docs/zigbee-ref.html#zigbee-getevent
  // example to parse:
  // read attr - raw: 3F9A0A00080A000020FE, dni: 3F9A, endpoint: 0A, cluster: 0008, size: 0A, attrId: 0000, encoding: 20, command: 01, value: FE
  // [name:level, value:100]
  // read attr - raw: 3F9A0A00060A00001001, dni: 3F9A, endpoint: 0A, cluster: 0006, size: 0A, attrId: 0000, encoding: 10, command: 01, value: 01
  // [name:switch, value:on]
  public getEvent(description: string): any {
    let event: any = {};
    if (isEmpty(description)) {
      return event;
    }

    if (description.startsWith("read attr - ")) {
      let parsedDescription = this.parseDescriptionAsMap(description);

      if (
        parsedDescription.get("clusterInt") == 8 &&
        parsedDescription.get("attrInt") == 0 &&
        hexStringToInt(parsedDescription.get("encoding")) == 0x20
      ) {
        let value = Math.round(
          hexStringToInt(parsedDescription.get("value")) / 2.55
        );
        event.name = "level";
        event.value = value;
      } else if (
        parsedDescription.get("clusterInt") == 6 &&
        parsedDescription.get("attrInt") == 0 &&
        hexStringToInt(parsedDescription.get("encoding")) == 0x10
      ) {
        let value = hexStringToInt(parsedDescription.get("value"));
        if (value == 0) {
          event.name = "switch";
          event.value = "off";
        } else if (value == 1) {
          event.name = "switch";
          event.value = "on";
        }
      }
    }

    return event;
  }

  public on(delay: number = ZigBeeUtils.DEFAULT_DELAY): Array<string> {
    return this.command(6, 1, "", {}, delay);
  }

  public off(delay: number = ZigBeeUtils.DEFAULT_DELAY): Array<string> {
    return this.command(6, 0, "", {}, delay);
  }

  public onOffRefresh(delay: number = ZigBeeUtils.DEFAULT_DELAY): Array<string> {
    return this.readAttribute(6, 0, null, delay);
  }

  // [zdo bind 0xFC6E 0x01 0x01 0x0006 {000DFF0055DDFFAA} {}, delay 2000, st cr 0xFC6E 0x01 0x0006 0x0000 0x10 0x0000 0x0258 {}, delay 2000]
  // onOffConfig(0,300)
  //[zdo bind 0xFC6E 0x01 0x01 0x0006 {000D6F00055D8FA6} {}, delay 2000, st cr 0xFC6E 0x01 0x0006 0x0000 0x10 0x0000 0x012C {}, delay 2000]
  // onOffConfig(5,100)
  //[zdo bind 0xFC6E 0x01 0x01 0x0006 {000D6F00055D8FA6} {}, delay 2000, st cr 0xFC6E 0x01 0x0006 0x0000 0x10 0x0005 0x0064 {}, delay 2000]
  //onOffConfig(10)
  //[zdo bind 0xFC6E 0x01 0x01 0x0006 {000D6F00055D8FA6} {}, delay 2000, st cr 0xFC6E 0x01 0x0006 0x0000 0x10 0x000A 0x0258 {}, delay 2000]
  public onOffConfig(
    minReportTime: number = 0,
    maxReportTime: number = 600,
    delay: number = ZigBeeUtils.DEFAULT_DELAY
  ): Array<string> {
    return this.configureReporting(
      6,
      0,
      0x10,
      minReportTime,
      maxReportTime,
      null,
      null,
      delay
    );
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
      `zdo bind 0x${this._device.deviceNetworkId
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
      `ph cr 0x${this._device.deviceNetworkId
      } 0x${this.getFormattedDeviceEndpoint()} 0x${numberToHexString(
        clusterId,
        2
      )} 0x${numberToHexString(attributeId, 2)} 0x${numberToHexString(
        dataType,
        1
      )} 0x${numberToHexString(minReportTime, 2)} 0x${numberToHexString(
        maxReportTime,
        2
      )} {${reportableChange != null
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
      )} 0x${numberToHexString(dataType, 1)} {${stringValue}} {${mfgCode > -1 ? numberToHexString(mfgCode, 2) : ""
      }}`
    );

    if (delay > 0) {
      arrayList.push("delay " + delay);
    }

    return arrayList;
  }

  public batteryConfig(delay: number = ZigBeeUtils.DEFAULT_DELAY): Array<string> {
    return this.configureReporting(0x0001, 0x0020, 0x20, 0x001E, 0x5460, 1, null, delay);
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
    return this.configureReporting(8, 0, 0x20, minReportTime, maxReportTime, reportableChange, null, delay);
  }

  public levelRefresh(delay: number = ZigBeeUtils.DEFAULT_DELAY): Array<string> {
    return this.readAttribute(0x0008, 0x0000, null, delay);
  }

  public setLevel(
    level: number,
    rate: number = 0xffff,
    delay: number = ZigBeeUtils.DEFAULT_DELAY
  ): Array<string> {
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

    return this.command(0x0008, 0x04, numberToHexString(level, 1) + " " + DataType.pack(rate, DataType.UINT16, true));
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
      )} {${payload != null ? payload : ""}} {${mfgCode > -1 ? numberToHexString(mfgCode, 2) : ""
      }}`
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
