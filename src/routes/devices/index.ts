import { Request, Response } from "express";
import { DeviceService } from "../../device/device-service";
import { EntityService } from "../../entity/entity-service";
import { Device } from "../../device/models/device";
import { Command } from "../../device/models/command";
import { Capability } from "../../device/models/capability";
import { Capabilities } from "../../device/models/capabilities";
import { DeviceSetting } from "../../device/models/device-setting";
import { State } from "../../device/models/state";
import { DeviceHandler } from "../../device/models/device-handler";

const express = require("express");


function castArgs(args: any[]): any[] | any {
  if (args == null || args.length === 0) {
    return null;
  }

  let castArgs = args.map((arg) => {
    let argType = arg.dataType.toUpperCase();
    if (argType === "NUMBER") {
      return Number(arg.value.toString());
    } else {
      return arg.value.toString();
    }
  });
  if (castArgs.length === 1) {
    return castArgs[0];
  }
  return castArgs;
}

module.exports = function (
  deviceService: DeviceService,
  entityService: EntityService
) {
  const router = express.Router();
  router.get("/", (req: Request, res: Response) => {
    let filter: string;
    if (typeof req.query.filter === "string") {
      filter = req.query.filter;
      if (filter.startsWith("capability.")) {
        filter = filter.substring("capability.".length);
      }
    }

    let fields: string[];
    if (typeof req.query.field === "string") {
      fields = [req.query.field];
    } else if (Array.isArray(req.query.field)) {
      fields = req.query.field as string[];
    }

    let devices: Device[];
    if (filter) {
      devices = deviceService.getDevicesByCapability(filter);
    } else {
      devices = deviceService.getDevices();
    }
    let deviceListData: any[] = [];

    if (devices) {
      devices.forEach((device) => {
        if (fields) {
          let devData: any = {};
          fields.forEach((field) => {
            switch (field) {
              case "id":
                devData.id = device.id;
                break;
              case "name":
                devData.name = device.name;
                break;
              case "label":
                devData.label = device.label;
                break;
              case "displayName":
                devData.displayName = device.displayName;
                break;
              case "deviceNetworkId":
                devData.deviceNetworkId = device.deviceNetworkId;
                break;
              case "type":
                devData.type = deviceService.getDeviceHandler(
                  device.deviceHandlerId
                )?.name;
            }
          });
          deviceListData.push(devData);
        } else {
          let devData: any = {
            id: device.id,
            name: device.name,
            label: device.label,
            displayName: device.displayName,
            deviceNetworkId: device.deviceNetworkId,
            type: deviceService.getDeviceHandler(device.deviceHandlerId)?.name,
          };

          deviceListData.push(devData);
        }
      });
    }

    res.json(deviceListData);
  });

  // add device
  router.post("/", (req: Request, res: Response) => {
    let deviceParams = req.body;

    let d: Device = new Device();
    //handle integration
    d.integration.id = deviceParams.integrationId;
    d.deviceNetworkId = deviceParams.device.deviceNetworkId;
    d.name = deviceParams.device.name;
    d.label = deviceParams.device.label;
    d.deviceHandlerId = deviceParams.device.deviceHandlerId;
    let deviceId = deviceService.addDevice(d);

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
    let id: string = req.params.id;
    let basic: boolean = "true" === req.query.basic;
    let device: Device = deviceService.getDevice(id);
    if (!device) {
      res.status(404).end();
    } else {
      let model: any = {
        id: device.id,
        name: device.name,
        label: device.label,
        integrationId: device.integration?.id,
      };
      if (!basic) {
        let deviceHandler: DeviceHandler = deviceService.getDeviceHandler(
          device.deviceHandlerId
        );
        if (deviceHandler) {
          model.type = deviceHandler.name;
        }
        model.deviceHandlerId = device.deviceHandlerId;
        model.deviceNetworkId = device.deviceNetworkId;
        model.created = device.created;
        model.updated = device.updated;
      }
      res.json(model);
    }
  });

  // remove a device
  router.delete("/:id", (req: Request, res: Response) => {
    let id: string = req.params.id;
    let force: boolean = "true" === req.query.force;
    let cancel: boolean = "true" === req.query.cancel;
    let longPoll: boolean = "true" === req.query.poll;
    if (cancel) {
      entityService.cancelRemoveDeviceAsync(id);
      res.status(202).end();
    } else {
      let deviceRemovedPromise: Promise<boolean> =
        entityService.removeDeviceAsync(id, force);

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
          // check for existing command and don't add duplicates
          if (commands.findIndex((cmd) => cmd.name === command.name) < 0) {
            commands.push(command);
          }
        });
      });
      let commandList: Command[] = deviceHandlerInfo.commandList;
      if (commandList != null) {
        commandList.forEach((command: Command) => {
          if (commands.findIndex((cmd) => cmd.name === command.name) < 0) {
            commands.push(command);
          }
        });
      }
    }

    res.json(commands);
  });

  router.get("/:id/events", (req: Request, res: Response) => {
    let id: string = req.params.id;
    let fromDate: Date = new Date();
    fromDate.setDate(fromDate.getDate() - 7);
    let events = entityService.eventsSince("DEVICE", id, fromDate, -1);
    res.json(events);
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
      entityService.runDeviceMethod(deviceId, command, castArgs(body));
    } else {
      entityService.runDeviceMethod(deviceId, command, null);
    }
    res.status(202).end();
  });

  router.get("/:id/settings", (req: Request, res: Response) => {
    let id: string = req.params.id;
    let device: Device = deviceService.getDevice(id);
    let settings: Map<string, DeviceSetting> = device.getNameToSettingMap();
    if (!settings) {
      res.json({});
    } else {
      res.json(Object.fromEntries(settings));
    }
  });

  router.get("/:id/states", (req: Request, res: Response) => {
    let id: string = req.params.id;
    let device: Device = deviceService.getDevice(id);

    let currentStates: State[];
    // get current states from device
    if (device.currentStates != null) {
      currentStates = Array.from(device.currentStates.values());
    } else {
      currentStates = [];
    }

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
