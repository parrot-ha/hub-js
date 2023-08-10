import { ResetIntegrationExtension } from "../integration/reset-integration-extension";
import { HubAction } from "../device/models/hub-action";
import { HubResponse } from "../device/models/hub-response";
import { DeviceIntegration } from "../integration/device-integration";
const { Controller } = require("zigbee-herdsman");
import { randomBytes } from "crypto";
import {
  hexStringToNumberArray,
  numberArrayToHexString,
} from "../utils/hex-utils";
import { PreferencesBuilder } from "../integration/preferences-builder";
import { DeviceScanIntegrationExtension } from "../integration/device-scan-integration-extension";

const logger = require("../hub/logger-service")({
  source: "ZigbeeIntegration",
});

export default class ZigbeeIntegration
  extends DeviceIntegration
  implements ResetIntegrationExtension, DeviceScanIntegrationExtension
{
  private _coordinator: any;

  public removeIntegrationDeviceAsync(
    deviceNetworkId: string,
    force: boolean
  ): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  public processAction(action: HubAction): HubResponse {
    throw new Error("Method not implemented.");
  }

  public start(): void {
    //TODO: lookup from settings
    let serialPortName = this.getSettingAsString("serialPortName");
    let adapterType = this.getSettingAsString("adapterType", "zstack");
    let panID = this.getSettingAsInteger("panID");
    let extendedPanIDStr: string = this.getSettingAsString("extendedPanID");
    let networkKeyStr: string = this.getSettingAsString("networkKey");
    let zigbeeChannel = this.getSettingAsString("userZigbeeChannel");
    let zigbeeChannelList: number[] = [
      11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
    ];

    const DB = "userData/zigbee/devices.db";

    if (serialPortName && adapterType) {
      if (!panID) {
        panID = parseInt(randomBytes(2).toString("hex"), 16);
      }
      if (!extendedPanIDStr) {
        // generate random extended pan id
        extendedPanIDStr = numberArrayToHexString(
          Array.from(Array(8)).map(() =>
            parseInt(randomBytes(1).toString("hex"), 16)
          )
        );
      }
      if (!networkKeyStr) {
        // generate random network key str
        networkKeyStr = numberArrayToHexString(
          Array.from(Array(16)).map(() =>
            parseInt(randomBytes(1).toString("hex"), 16)
          )
        );
      }

      if (zigbeeChannel === "Use Existing Value") {
        let zigbeeChannelStr = this.getSettingAsString("zigbeeChannel");
        if (zigbeeChannelStr) {
          zigbeeChannelList = [parseInt(zigbeeChannelStr)];
        }
      } else if (zigbeeChannel) {
        zigbeeChannelList = [parseInt(zigbeeChannel)];
      }
      try {
        this._coordinator = new Controller({
          network: {
            panID: panID,
            extendedPanID: hexStringToNumberArray(extendedPanIDStr),
            networkKey: hexStringToNumberArray(networkKeyStr),
            channelList: zigbeeChannelList,
          },
          serialPort: { path: serialPortName, adapter: adapterType },
          databasePath: DB,
        });

        this._coordinator.on("message", async (msg: any) => {
          console.log(msg);
        });

        this._coordinator
          .start((err: any) => {
            if (err) {
              console.error(err);
            }
          })
          .then(() => {
            console.log("started with device", serialPortName);

            this._coordinator
              .getNetworkParameters()
              .then((networkParameters: any) => {
                //TODO: save the settings
                this._displayInformation["Channel"] = networkParameters.channel;
                this._displayInformation["Extended Pan ID"] =
                  networkParameters.extendedPanID;
                this._displayInformation["Pan ID"] = networkParameters.panID;
                //model.put("Node ID", HexUtils.integerToHexString(zigBeeHandler.getNetworkManager().getLocalNwkAddress(), 2));
                this._displayInformation["Status"] = "Online";
              });
          })
          .catch((err: Error) => {
            console.log("err in controller start", err);
          });
      } catch (err) {
        console.log(err);
      }
    }
  }

  public stop(): Promise<any> {
    return this._coordinator.stop();
  }

  public getPreferencesLayout(): any {
    return new PreferencesBuilder()
      .withEnumInput(
        "adapterType",
        "Adapter Type",
        "Adapter Type",
        ["zstack", "ezsp"],
        false,
        true,
        true
      )
      .withTextInput(
        "serialPortName",
        "Serial Port Name",
        "Serial Port Name",
        true,
        true
      )
      .withEnumInput(
        "serialPortBaud",
        "Serial Port Baud",
        "Serial Port Baud",
        ["57600", "115200"],
        false,
        true,
        true
      )
      .withEnumInput(
        "serialPortFlowControl",
        "Serial Port Flow Control",
        "Serial Port Flow Control",
        ["Software (XOn / XOff)", "Hardware (RTS / CTS)"],
        false,
        true,
        true
      )
      .withEnumInput(
        "userZigbeeChannel",
        "ZigBee Channel",
        "ZigBee Channel",
        [
          "Use Existing Value",
          "11",
          "12",
          "13",
          "14",
          "15",
          "16",
          "17",
          "18",
          "19",
          "20",
          "21",
          "22",
          "23",
          "24",
          "25",
          "26",
        ],
        false,
        false,
        true
      )
      .build();
  }

  public get name(): string {
    return "ZigBee";
  }

  public get description(): string {
    return "Allows integration of ZigBee devices via an add on radio.";
  }

  private _displayInformation: any = {};
  public get displayInformation(): any {
    return this._displayInformation;
  }

  public settingValueChanged(keys: string[]): void {
    logger.info("setting value changed" + JSON.stringify(keys));
    if (
      keys.find((value) => value === "serialPortName") ||
      keys.find((value) => value === "serialPortBaud") ||
      keys.find((value) => value === "serialPortFlowControl")
    ) {
      // restart the integration
      this.stop();
      this.start();
    }

    if (keys.find((value) => value === "zigbeeChannel")) {
      //TODO: change the channel of the zigbee radio
      // Object channelObj = getSettingAsString("zigbeeChannel");
      // if (channelObj instanceof String && NumberUtils.isCreatable((String) channelObj)) {
      //     int channel = NumberUtils.createInteger((String) channelObj);
      //     if (channel > 10 && channel < 27) {
      //         zigBeeHandler.changeChannel(channel);
      //     }
      // }
    }
  }

  reset(): Promise<boolean> {
    if (this._coordinator != null) {
      return new Promise<boolean>((resolve) => {
        this._coordinator
          .reset("hard")
          .then(() => {
            console.log("coordinator reset");
            resolve(true);
          })
          .catch((err: Error) => {
            logger.warn("error: " + err.message);
            resolve(false);
          });
      });
    } else {
      return new Promise<boolean>((resolve) => {
        resolve(false);
      });
    }
  }

  getResetWarning(): string {
    return "Warning: Radio will be reset and all ZigBee Devices will have to be reset and re-joined.";
  }

  private _joinMode = false;

  public startScan(options: Object): boolean {
    //TODO: listen for events from coordinator
    this._coordinator.permitJoin(true, null, 90);
    this._joinMode = true;
    return true;
  }

  public stopScan(options: Object): boolean {
    this._coordinator.permitJoin(false);
    this._joinMode = false;
    return true;
  }

  getScanStatus(options: Object): Object {
    return { running: this._joinMode };
  }
}
