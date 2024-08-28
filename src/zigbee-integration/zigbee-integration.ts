import { ResetIntegrationExtension } from "../integration/reset-integration-extension";
import { HubAction } from "../device/models/hub-action";
import { HubResponse } from "../device/models/hub-response";
import { DeviceIntegration } from "../integration/device-integration";
const { Controller } = require("zigbee-herdsman");
import { randomBytes } from "crypto";
import {
  hexStringToInt,
  hexStringToNumberArray,
  numberArrayToHexString,
  numberToHexString,
} from "../utils/hex-utils";
import { PreferencesBuilder } from "../integration/preferences-builder";
import { DeviceScanIntegrationExtension } from "../integration/device-scan-integration-extension";
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
import { ZclPayload } from "zigbee-herdsman/dist/adapter/events";
import { isEmpty, isNotBlank } from "../utils/string-utils";
import {
  DeviceAddedEvent,
  DeviceMessageEvent,
  DeviceUpdatedEvent,
} from "../integration/integration-events";
import { sendZigbeeMessage } from "./zigbee-message-transformer";
import fs from "fs";
import { parse } from "./zigbee-message-parser";

const logger = require("../hub/logger-service")({
  source: "ZigbeeIntegration",
});

const backup = "userData/zigbee/network.bak";

export default class ZigbeeIntegration
  extends DeviceIntegration
  implements ResetIntegrationExtension, DeviceScanIntegrationExtension
{
  private _controller: any;

  public removeIntegrationDeviceAsync(
    deviceNetworkId: string,
    force: boolean,
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      try {
        let zbDevice: ZigbeeDevice = this._controller.getDeviceByNetworkAddress(
          hexStringToInt(deviceNetworkId),
        );
        if (zbDevice == null) {
          logger.info("zigbee device not found to delete: " + deviceNetworkId);
          resolve(true);
        } else {
          zbDevice
            .removeFromNetwork()
            .then(() => resolve(true))
            .catch((err) => {
              logger.warn("error on remove from network " + err.message);
              if (force) {
                logger.warn("force deleting zigbee device");
                zbDevice.removeFromDatabase();
                // .then(() => resolve(true))
                // .catch((err) => {
                // logger.warn(
                // "error on force remove from database " + err.message
                // );
                // resolve(true);
                // });
              } else {
                resolve(false);
              }
            });
        }
      } catch (err) {
        resolve(false);
      }
    });
  }

  public processAction(action: HubAction): HubResponse {
    if (action === null) return null;

    let msg = action.action;
    sendZigbeeMessage(msg, this._controller);

    return null;
  }

  public start(): void {
    let initialSetup: boolean = false;
    //TODO: lookup from settings
    let serialPortName = this.getSettingAsString("serialPortName");
    let adapterType = this.getSettingAsString("adapterType", "zstack");
    let panIDStr = this.getSettingAsString("panID");
    let extendedPanIDStr: string = this.getSettingAsString("extendedPanID");
    let networkKeyStr: string = this.getSettingAsString("networkKey");
    let zigbeeChannel = this.getSettingAsString("userZigbeeChannel");
    // zigbee herdsman always grabs the first entry in the list.
    //TODO: figure out how to discover a clear channel.
    let zigbeeChannelList: number[] = [20];

    const DB = "userData/zigbee/devices.db";
    const dbBackup = "userData/zigbee/devices.bak";

    if (serialPortName && adapterType) {
      let panID;
      if (!panIDStr) {
        panID = parseInt(randomBytes(2).toString("hex"), 16);
        this.updateSetting(
          "panID",
          numberToHexString(panID, 2),
          "number",
          false,
        );
        initialSetup = true;
      } else {
        panID = hexStringToInt(panIDStr);
      }
      if (!extendedPanIDStr) {
        // generate random extended pan id
        extendedPanIDStr = numberArrayToHexString(
          Array.from(Array(8)).map(() =>
            parseInt(randomBytes(1).toString("hex"), 16),
          ),
        );
        this.updateSetting("extendedPanID", extendedPanIDStr, "string", false);

        initialSetup = true;
      }
      if (!networkKeyStr) {
        // generate random network key str
        networkKeyStr = numberArrayToHexString(
          Array.from(Array(16)).map(() =>
            parseInt(randomBytes(1).toString("hex"), 16),
          ),
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
        if (!fs.existsSync("userData/")) {
          fs.mkdirSync("userData/");
        }
        if (!fs.existsSync("userData/zigbee/")) {
          fs.mkdirSync("userData/zigbee/");
        }

        this._controller = new Controller({
          network: {
            panID: panID,
            extendedPanID: hexStringToNumberArray(extendedPanIDStr),
            networkKey: hexStringToNumberArray(networkKeyStr),
            channelList: zigbeeChannelList,
          },
          serialPort: { path: serialPortName, adapter: adapterType },
          databasePath: DB,
          backupPath: backup,
          databaseBackupPath: dbBackup,
        });

        this._controller.on("message", async (msg: MessagePayload) => {
          this.zigbeeMessage(msg);
        });

        this._controller.on(
          "deviceJoined",
          async (msg: DeviceJoinedPayload) => {
            this.deviceJoined(msg);
          },
        );
        this._controller.on(
          "deviceInterview",
          async (msg: DeviceInterviewPayload) => {
            this.deviceInterview(msg);
          },
        );
        this._controller.on(
          "deviceAnnounce",
          async (msg: DeviceAnnouncePayload) => {
            this.deviceAnnounce(msg);
          },
        );
        this._controller.on("deviceLeave", async (msg: DeviceLeavePayload) => {
          this.deviceLeave(msg);
        });
        this._controller.on(
          "deviceNetworkAddressChanged",
          async (msg: DeviceNetworkAddressChangedPayload) => {
            this.deviceNetworkAddressChanged(msg);
          },
        );
        this._controller.on(
          "permitJoinChanged",
          async (msg: PermitJoinChangedPayload) => {
            this.permitJoinChanged(msg);
          },
        );

        this._controller
          .start((err: any) => {
            if (err) {
              console.error(err);
            }
          })
          .then(() => {
            logger.debug("started with device " + serialPortName);
            this.registerAdapterListener();
            this._controller
              .getNetworkParameters()
              .then((networkParameters: any) => {
                this._displayInformation["Channel"] = networkParameters.channel;
                this._displayInformation["Extended Pan ID"] =
                  networkParameters.extendedPanID;
                this._displayInformation["Pan ID"] = numberToHexString(
                  networkParameters.panID,
                  2,
                );
                //model.put("Node ID", HexUtils.integerToHexString(zigBeeHandler.getNetworkManager().getLocalNwkAddress(), 2));
                this._displayInformation["Status"] = "Online";
                if (initialSetup) {
                  logger.debug("initial setup, saving values");
                  this.updateSetting(
                    "zigbeeChannel",
                    networkParameters.channel,
                    "number",
                    false,
                  );
                  this._controller.backup();
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

  protected registerAdapterListener(count = 0) {
    if (count > 10) return;
    if (
      this._controller.adapter == null ||
      typeof this._controller.adapter == "undefined"
    ) {
      var timeout = (count + 1) * 100;

      setTimeout(this.registerAdapterListener, timeout, count + 1);
    } else {
      this._controller.adapter.on("zclPayload", this.onZclPayload.bind(this));
    }
  }

  protected async onZclPayload(payload: ZclPayload) {
    if (payload.clusterID == 25) {
      return;
    }

    let [dni, msgStr] = parse(payload);

    if (dni != null && msgStr != null) {
      this.sendEvent(new DeviceMessageEvent(dni, msgStr));
    }
  }

  protected zigbeeMessage(msg: MessagePayload) {
    if (msg.type != "commandQueryNextImageRequest") {
      logger.debug("zigbee message type: " + msg.type);
      logger.debug(JSON.stringify(msg));
    }
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
          numberToHexString(msg.device.networkAddress, 2),
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
      // send event, service should handle updated device
      if (msg.device.interviewCompleted) {
        let additionalParams: Map<string, string> = new Map<string, string>();

        additionalParams.set("zigbeeId", msg.device.ieeeAddr);

        // TODO: send rest of information (same as device added event) in case the
        // system does not have this device and it will have to process this as a
        // device add
        this.sendEvent(
          new DeviceUpdatedEvent(
            numberToHexString(msg.device.networkAddress, 2),
            "deviceNetworkId",
            additionalParams,
          ),
        );
      }
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
    logger.debug("Node added: " + JSON.stringify(node));
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
    for (let zigBeeEndpoint of zigbeeDevice.endpoints) {
      logger.debug("New Node Endpoint: " + JSON.stringify(zigBeeEndpoint));

      let fingerprint = new Map<string, string>([
        ["inClusters", ""],
        ["outClusters", ""],
      ]);

      if (zigBeeEndpoint.getInputClusters().length > 0) {
        let inputClustersStr = zigBeeEndpoint
          .getInputClusters()
          .map((inputCluster) => numberToHexString(inputCluster.ID, 2))
          .join(",");
        fingerprint.set("inClusters", inputClustersStr);
      }
      if (zigBeeEndpoint.getOutputClusters().length > 0) {
        let outputClustersStr = zigBeeEndpoint
          .getOutputClusters()
          .map((inputCluster) => numberToHexString(inputCluster.ID, 2))
          .join(",");
        fingerprint.set("outClusters", outputClustersStr);
      }

      fingerprint.set(
        "profileId",
        numberToHexString(zigBeeEndpoint.profileID, 2),
      );

      let manufacturer = zigbeeDevice.manufacturerName;
      fingerprint.set("manufacturer", manufacturer);
      let model = zigbeeDevice.modelID;
      fingerprint.set("model", model);

      // add fingerprint to joinedDevices
      this.joinedDevices
        .get(zigbeeDevice.ieeeAddr)
        .set("fingerprint", fingerprint);

      let additionalParams: Map<string, string> = new Map<string, string>();

      additionalParams.set(
        "endpointId",
        numberToHexString(zigBeeEndpoint.ID, 1),
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
      // if in join mode or join mode was started in the past 5 minutes, consider it a user initiated add.
      let userInitiatedAdd =
        this._joinMode || Date.now() - this._joinStart > 1000 * 60 * 5;
      this.sendEvent(
        new DeviceAddedEvent(
          numberToHexString(zigbeeDevice.networkAddress, 2),
          userInitiatedAdd,
          fingerprint,
          deviceData,
          additionalParams,
        ),
      );

      return;
    }
  }

  public stop(): Promise<any> {
    return this._controller.stop();
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
        true,
      )
      .withTextInput(
        "serialPortName",
        "Serial Port Name",
        "Serial Port Name",
        true,
        true,
      )
      .withEnumInput(
        "serialPortBaud",
        "Serial Port Baud",
        "Serial Port Baud",
        ["57600", "115200"],
        false,
        true,
        true,
      )
      .withEnumInput(
        "serialPortFlowControl",
        "Serial Port Flow Control",
        "Serial Port Flow Control",
        ["Software (XOn / XOff)", "Hardware (RTS / CTS)"],
        false,
        true,
        true,
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
        true,
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
          false,
        );
        this.updateSetting(
          "userZigbeeChannel",
          "Use Existing Value",
          "string",
          false,
        );
      }
      //this._controller.

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
    if (this._controller != null) {
      return new Promise<boolean>((resolve) => {
        this._controller
          .reset("hard")
          .then(() => {
            logger.info("coordinator reset");
            // clear settings
            this.updateSetting("extendedPanID", null, "string", false);
            this.updateSetting("panID", null, "string", false);
            this.updateSetting("networkKey", null, "string", false);
            this.updateSetting("zigbeeChannel", null, "number", false);
            // restart the integration
            this.stop();
            fs.rmSync(backup);
            this.start();
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
    this._controller.permitJoin(true, null, 90);
    console.log("start scan");
    this._joinMode = true;
    this._joinStart = Date.now();
    return true;
  }

  public stopScan(options: Object): boolean {
    this._controller.permitJoin(false);
    this._joinMode = false;
    return true;
  }

  getScanStatus(options: Object): Object {
    let scanStatus: any = { running: this._joinMode };

    if (this.joinedDevices != null && this.joinedDevices.size > 0) {
      let joinedDevicesList: any[] = [];
      logger.debug(
        "joinedDevices: " +
          JSON.stringify(Object.fromEntries(this.joinedDevices)),
      );
      for (let key of this.joinedDevices.keys()) {
        let entryValue = this.joinedDevices.get(key);
        let joinedDeviceMap: any = {};
        joinedDeviceMap["Network Address"] = entryValue.get("networkAddress");
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
