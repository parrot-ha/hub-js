import { Request, Response } from "express";
import { DeviceService } from "../../services/device-service";
import { EntityService } from "../../services/entity-service";
import { Device } from "../../models/device";
import { DeviceHandler } from "../../models/device-handler";
import { Command } from "../../models/command";
import { Capability } from "../../models/capability";
import { Capabilities } from "../../models/capabilities";
import { DeviceSetting } from "../../models/device-setting";

const express = require("express");

module.exports = function (
  deviceService: DeviceService,
  entityService: EntityService
) {
  const router = express.Router();
  router.get("/", (req: Request, res: Response) => {
    let devices: Device[] = deviceService.getDevices();
    let deviceListData: Map<string, string>[] = [];

    if (devices) {
      devices.forEach((device) => {
        let devData: any = {};
        devData.id = device.id;
        devData.name = device.name;
        devData.label = device.label;
        devData.displayName = device.displayName;
        devData.deviceNetworkId = device.deviceNetworkId;
        let dh: DeviceHandler = deviceService.getDeviceHandler(
          device.deviceHandlerId
        );
        if (dh != null) {
          devData.type = dh.name;
        }

        deviceListData.push(devData);
      });
    }

    res.json(deviceListData);
  });

  // add device
  router.post("/", (req: Request, res: Response) => {
    let deviceParams = req.body;
    console.log("deviceParams", deviceParams);
    let deviceId = deviceService.addDevice(
      deviceParams.integrationId,
      deviceParams.device.deviceHandlerId,
      deviceParams.device.deviceNetworkId,
      deviceParams.device.name,
      deviceParams.device.label,
      null,
      null
    );

    if (deviceParams.settings) {
      let device: Device = deviceService.getDevice(deviceId);
      for (const key in deviceParams.settings) {
        device.addSetting(
          DeviceSetting.buildFromObject(deviceParams.settings[key])
        );
      }
      deviceService.saveDevice(device);
    }

    //run installed method
    entityService.runDeviceMethod(deviceId, "installed", null);

    res.json({ success: deviceId != null, deviceId: deviceId });
  });

  // Update a device
  router.put("/:id", (req: Request, res: Response) => {
    let id: string = req.params.id;

    let deviceSaved: boolean = false;

    let jsonBodyObj: any = req.body;

    let device: Device = deviceService.getDevice(id);

    if (device != null) {
      let deviceObj: any = jsonBodyObj.device;
      //handle preferences
      let settingsObj = jsonBodyObj.settings;
      deviceSaved = deviceService.updateDevice(id, deviceObj, settingsObj);
      if (deviceSaved) {
        //run updated method
        entityService.runDeviceMethod(id, "updated", null);
      }
    }

    res.json({ success: deviceSaved });
  });

  router.get("/:id", (req: Request, res: Response) => {
    res.json(deviceService.getDevice(req.params.id));
  });

  // remove a device
  router.delete("/:id", (req: Request, res: Response) => {
    let id: string = req.params.id;
    let force: boolean = "true" === req.params.force;
    let cancel: boolean = "true" === req.query.cancel;
    let longPoll: boolean = "true" === req.query.poll;
    if (cancel) {
      deviceService.cancelRemoveDeviceAsync(id);
      res.status(202).end();
    } else {
      let deviceRemovedPromise: Promise<any> = deviceService.removeDeviceAsync(
        id,
        force
      );

      // wait for promise to resolve if we are long polling
      if (longPoll) {
        deviceRemovedPromise.then(
          (deviceRemovedStatus) => {
            res.json({ success: deviceRemovedStatus });
          },
          (error) => {
            res.json({ success: false, message: error.message });
          }
        );
      } else {
        res.status(202).end();
      }
    }
  });

  router.get("/:id/commands", (req: Request, res: Response) => {
    let deviceId = req.params.id;
    let device = deviceService.getDevice(deviceId);
    let deviceHandlerInfo = deviceService.getDeviceHandler(
      device.deviceHandlerId
    );

    //get commands
    let commands: Command[] = [];
    if (deviceHandlerInfo != null) {
      let capabilityList: string[] = deviceHandlerInfo.capabilityList;
      capabilityList?.forEach((capabilityName: string) => {
        let capability: Capability = Capabilities.getCapability(capabilityName);
        capability?.commands?.forEach((command: Command) => {
          // TODO: check for existing command and don't add duplicates
          commands.push(command);
        });
      });
      let commandList: Command[] = deviceHandlerInfo.commandList;
      if (commandList != null) {
        commandList.forEach((command: Command) => {
          commands.push(command);
        });
      }
    }

    res.json(commands);
  });

  router.get("/:id/information", (req: Request, res: Response) => {
    let id: string = req.params.id;
    let device: Device = deviceService.getDevice(id);
    let information: any = {};
    information["data"] = device.data;
    res.json(information);
  });

  router.post("/:id/commands/:command", (req: Request, res: Response) => {
    const deviceId = req.params.id;
    const command = req.params.command;
    const body = req.body;
    if (body != null && Array.isArray(body) && body.length > 0) {
      entityService.runDeviceMethod(deviceId, command, body);
    } else {
      entityService.runDeviceMethod(deviceId, command, null);
    }
    res.status(202).end();
  });

  router.get("/:id/settings", (req: Request, res: Response) => {
    let id: string = req.params.id;
    let device: Device = deviceService.getDevice(id);
    let settings: Map<string, DeviceSetting> = device.getNameToSettingMap();
    res.json(settings);
  });

  router.get("/:id/states", (req: Request, res: Response) => {
    let id: string = req.params.id;
    let device: Device = deviceService.getDevice(id);

    let currentStates: any[];
    //TODO: get current states from device
    //Collection<State> currentStates;
    // if (device.getCurrentStates() != null) {
    //     currentStates = device.getCurrentStates().values();
    // } else {
    currentStates = [];
    // }

    res.json(currentStates);
  });

  router.get("/:id/preferences-layout", (req: Request, res: Response) => {
    // get device handler preferences.
    let id: string = req.params.id;
    let device: Device = deviceService.getDevice(id);
    if (device) {
      let pageInfo = entityService.getDeviceHandlerPreferencesLayout(
        device.deviceHandlerId
      );
      if (pageInfo == null) {
        pageInfo = {};
      }
      res.json(pageInfo);
    } else {
      res.status(404).end();
    }
  });

  return router;
};
