import { ResetIntegrationExtension } from "../integration/reset-integration-extension";
import { HubAction } from "../device/models/hub-action";
import { HubResponse } from "../device/models/hub-response";
import { DeviceIntegration } from "../integration/device-integration";
const { Controller } = require("zigbee-herdsman");
import { randomBytes } from "crypto";
import {
  hexStringToNumberArray,
  numberArrayToHexString,
  numberToHexString,
} from "../utils/hex-utils";
import { PreferencesBuilder } from "../integration/preferences-builder";
import { DeviceScanIntegrationExtension } from "../integration/device-scan-integration-extension";
//import { Device as ZigbeeDevice } from "zigbee-herdsman/dist/controller/model";
import {
  DeviceAnnouncePayload,
  DeviceInterviewPayload,
  DeviceJoinedPayload,
  DeviceLeavePayload,
  DeviceNetworkAddressChangedPayload,
  MessagePayload,
  PermitJoinChangedPayload,
} from "zigbee-herdsman/dist/controller/events";
import { Device as ZigbeeDevice } from "zigbee-herdsman/dist/controller/model";
import { isNotBlank } from "../utils/string-utils";
import { DeviceAddedEvent } from "../integration/integration-events";

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
    let initialSetup: boolean = false;
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
        this.updateSetting(
          "panID",
          numberToHexString(panID, 2),
          "number",
          false
        );
        initialSetup = true;
      }
      if (!extendedPanIDStr) {
        // generate random extended pan id
        extendedPanIDStr = numberArrayToHexString(
          Array.from(Array(8)).map(() =>
            parseInt(randomBytes(1).toString("hex"), 16)
          )
        );
        this.updateSetting("extendedPanID", extendedPanIDStr, "string", false);

        initialSetup = true;
      }
      if (!networkKeyStr) {
        // generate random network key str
        networkKeyStr = numberArrayToHexString(
          Array.from(Array(16)).map(() =>
            parseInt(randomBytes(1).toString("hex"), 16)
          )
        );
        this.updateSetting("networkKey", networkKeyStr, "string", false);
        initialSetup = true;
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

        this._coordinator.on("message", async (msg: MessagePayload) => {
          this.zigbeeMessage(msg);
        });

        this._coordinator.on(
          "deviceJoined",
          async (msg: DeviceJoinedPayload) => {
            this.deviceJoined(msg);
          }
        );
        this._coordinator.on(
          "deviceInterview",
          async (msg: DeviceInterviewPayload) => {
            this.deviceInterview(msg);
          }
        );
        this._coordinator.on(
          "deviceAnnounce",
          async (msg: DeviceAnnouncePayload) => {
            this.deviceAnnounce(msg);
          }
        );
        this._coordinator.on("deviceLeave", async (msg: DeviceLeavePayload) => {
          this.deviceLeave(msg);
        });
        this._coordinator.on(
          "deviceNetworkAddressChanged",
          async (msg: DeviceNetworkAddressChangedPayload) => {
            this.deviceNetworkAddressChanged(msg);
          }
        );
        this._coordinator.on(
          "permitJoinChanged",
          async (msg: PermitJoinChangedPayload) => {
            this.permitJoinChanged(msg);
          }
        );

        this._coordinator
          .start((err: any) => {
            if (err) {
              console.error(err);
            }
          })
          .then(() => {
            logger.debug("started with device " + serialPortName);

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
                if (initialSetup) {
                  logger.debug("initial setup, saving values");
                  this.updateSetting(
                    "zigbeeChannel",
                    networkParameters.channel,
                    "number",
                    false
                  );
                }
              });
          })
          .catch((err: Error) => {
            logger.warn("err in controller start", err);
          });
      } catch (err) {
        logger.warn(err);
      }
    }
  }

  private zigbeeMessage(msg: MessagePayload) {
    logger.debug("zigbee message type: " + msg.type);
    if (msg.type != "commandQueryNextImageRequest") logger.debug(msg);
  }

  private deviceJoined(msg: DeviceJoinedPayload) {
    console.log("deviceJoined", msg);
    if (msg.device) {
      // new device joined!
    }
  }
  private deviceInterview(msg: DeviceInterviewPayload) {
    console.log("deviceInterview", msg);
    if (msg.device) {
      // new device inteview!
      if (!this.joinedDevices.has(msg.device.ieeeAddr)) {
        let deviceMap = new Map<string, any>();
        deviceMap.set(
          "networkAddress",
          numberToHexString(msg.device.networkAddress, 1)
        );
        deviceMap.set("initializing", false);
        this.joinedDevices.set(msg.device.ieeeAddr, deviceMap);
      }
      if (msg.status === "successful") {
        this.nodeAdded(msg.device);
      }
    }
  }
  private deviceAnnounce(msg: DeviceAnnouncePayload) {
    console.log("deviceAnnounce", msg);
    if (msg.device) {
      // new device announced
    }
  }
  private deviceLeave(msg: DeviceLeavePayload) {
    console.log("deviceLeave", msg);
    if (msg.ieeeAddr) {
      // device left
    }
  }
  private deviceNetworkAddressChanged(msg: DeviceNetworkAddressChangedPayload) {
    console.log("deviceNetworkAddressChanged", msg);
    if (msg.device) {
      // device network address changed
    }
  }
  private permitJoinChanged(msg: PermitJoinChangedPayload) {
    console.log("permitJoinChanged", msg);
    this._joinMode = msg.permitted;
  }

  public nodeAdded(node: ZigbeeDevice): void {
    logger.debug("Node added: " + node.toString());
    if (this.checkAndUpdateNodeInitializing(node)) {
      this.addNode(node);
    }
  }

  private checkAndUpdateNodeInitializing(node: ZigbeeDevice): boolean {
    // wait for node added message where node has endpoints.
    if (node.endpoints == null || node.endpoints.length == 0) {
      return false;
    }
    if (this.joinedDevices == null || !this.joinedDevices.has(node.ieeeAddr)) {
      return false;
    }
    if (this.joinedDevices.get(node.ieeeAddr).get("initializing") === true) {
      return false;
    }
    this.joinedDevices.get(node.ieeeAddr).set("initializing", true);
    return true;
  }

  private addNode(zigbeeDevice: ZigbeeDevice): void {
    logger.debug("we have a node that was just joined to the network");

    for (let zigBeeEndpoint of zigbeeDevice.endpoints) {
      logger.debug("New Node Endpoint: " + JSON.stringify(zigBeeEndpoint));

      let fingerprint = new Map<string, string>([
        ["inClusters", ""],
        ["outClusters", ""],
      ]);

      if (zigBeeEndpoint.getInputClusters().length > 0) {
        let inputClustersStr = zigBeeEndpoint
          .getInputClusters()
          .map((inputCluster) => numberToHexString(inputCluster.ID, 1))
          .join(",");
        fingerprint.set("inClusters", inputClustersStr);
      }
      if (zigBeeEndpoint.getOutputClusters().length > 0) {
        let outputClustersStr = zigBeeEndpoint
          .getOutputClusters()
          .map((inputCluster) => numberToHexString(inputCluster.ID, 1))
          .join(",");
        fingerprint.set("outClusters", outputClustersStr);
      }

      fingerprint.set(
        "profileId",
        numberToHexString(zigBeeEndpoint.profileID, 2)
      );

      //TODO: lookup manufactuer and model from device, right now it appears that this is empty.
      let manufacturer =
        zigBeeEndpoint.getClusterAttributeValue(0, 4)?.toString() || "0";
      fingerprint.set("manufacturer", manufacturer);
      let model =
        zigBeeEndpoint.getClusterAttributeValue(0, 5)?.toString() || "0";
      fingerprint.set("model", model);

      // add fingerprint to joinedDevices
      this.joinedDevices
        .get(zigbeeDevice.ieeeAddr)
        .set("fingerprint", fingerprint);

      let additionalParams: Map<string, string> = new Map<string, string>();

      additionalParams.set(
        "endpointId",
        numberToHexString(zigBeeEndpoint.ID, 1)
      );
      additionalParams.set("zigbeeId", zigbeeDevice.ieeeAddr);
      let deviceData: Map<string, any> = new Map<string, any>();
      deviceData.set("endpointId", "01");
      if (isNotBlank(manufacturer)) {
        deviceData.set("manufacturer", manufacturer);
      }
      if (isNotBlank(model)) {
        deviceData.set("model", model);
      }
      // // if in join mode or join mode was started in the past 5 minutes, consider it a user initiated add.
      let userInitiatedAdd =
        this._joinMode || Date.now() - this._joinStart > 1000 * 60 * 5;
      this.sendEvent(
        new DeviceAddedEvent(
          numberToHexString(zigbeeDevice.networkAddress, 2),
          userInitiatedAdd,
          fingerprint,
          deviceData,
          additionalParams
        )
      );

      return;
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

    if (keys.find((value) => value === "userZigbeeChannel")) {
      // update zigbee channel based on user zigbee channel
      let zigbeeChannel = this.getSettingAsString("userZigbeeChannel");
      if (zigbeeChannel !== "Use Existing Value") {
        this.updateSetting(
          "zigbeeChannel",
          this.getSettingAsInteger("userZigbeeChannel"),
          "number",
          false
        );
        this.updateSetting(
          "userZigbeeChannel",
          "Use Existing Value",
          "string",
          false
        );
      }

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
            logger.info("coordinator reset");
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

  private _joinMode: boolean = false;
  private _joinStart: number = 0;
  private joinedDevices: Map<string, Map<string, any>> = new Map<
    string,
    Map<string, any>
  >();

  public startScan(options: Object): boolean {
    //TODO: listen for events from coordinator
    this._coordinator.permitJoin(true, null, 90);
    console.log("start scan");
    this._joinMode = true;
    this._joinStart = Date.now();
    return true;
  }

  public stopScan(options: Object): boolean {
    this._coordinator.permitJoin(false);
    this._joinMode = false;
    return true;
  }

  getScanStatus(options: Object): Object {
    let scanStatus: any = { running: this._joinMode };

    if (this.joinedDevices != null && this.joinedDevices.size > 0) {
      let joinedDevicesList: any[] = [];
      logger.debug(
        "joinedDevices: " +
          JSON.stringify(Object.fromEntries(this.joinedDevices))
      );
      for (let key of this.joinedDevices.keys()) {
        let entryValue = this.joinedDevices.get(key);
        let joinedDeviceMap: any = {};
        logger.debug(
          "entryValue: " + JSON.stringify(Object.fromEntries(entryValue))
        );
        joinedDeviceMap["Network Address"] = numberToHexString(
          entryValue.get("networkAddress"),
          2
        );
        joinedDeviceMap["IEEE Address"] = key;

        let fingerprint = entryValue.get("fingerprint");
        if (fingerprint != null) {
          joinedDeviceMap["Fingerprint"] = Object.fromEntries(fingerprint);
          joinedDeviceMap["Join Status"] = "Done";
        } else {
          joinedDeviceMap["Join Status"] = "Initializing";
        }
        joinedDevicesList.push(joinedDeviceMap);
      }
      scanStatus["foundDevices"] = joinedDevicesList;
    }
    return scanStatus;
  }
}
