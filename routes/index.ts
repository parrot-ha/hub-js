import { Application, Request, Response } from "express";
import { DeviceService } from "../services/device-service";
import { EntityService } from "../services/entity-service";
import { ServiceFactory } from "../services/service-factory";
import { SmartAppService } from "../services/smart-app-service";
import { Device } from "../models/device";
import { DeviceHandler } from "../models/device-handler";
import { Command } from "../models/command";
import { Capability } from "../models/capability";
import { Capabilities } from "../models/capabilities";
import { DeviceSetting } from "../models/device-setting";

module.exports = function (app: Application) {
  //TODO: move these to separate route directories and move functionality to controllers
  //https://medium.com/@sesitamakloe/how-we-structure-our-express-js-routes-58933d02e491

  let deviceService: DeviceService =
    ServiceFactory.getInstance().getDeviceService();

  let smartAppService: SmartAppService =
    ServiceFactory.getInstance().getSmartAppService();

  let entityService: EntityService =
    ServiceFactory.getInstance().getEntityService();

  app.get("/api/devices", (req: Request, res: Response) => {
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
  app.post("/api/devices", (req: Request, res: Response) => {
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

  app.get("/api/devices/:id", (req: Request, res: Response) => {
    res.json(deviceService.getDevice(req.params.id));
  });

  app.get("/api/devices/:id/commands", (req: Request, res: Response) => {
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

  app.get("/api/devices/:id/information", (req: Request, res: Response) => {
    let id: string = req.params.id;
    let device: Device = deviceService.getDevice(id);
    let information: any = {};
    information["data"] = device.data;
    res.json(information);
  });

  app.post(
    "/api/devices/:id/commands/:command",
    (req: Request, res: Response) => {
      const deviceId = req.params.id;
      const command = req.params.command;
      const body = req.body;
      if (body != null && Array.isArray(body) && body.length > 0) {
        entityService.runDeviceMethod(deviceId, command, body);
      } else {
        entityService.runDeviceMethod(deviceId, command, null);
      }
      res.status(202).end();
    }
  );

  app.get(
    "/api/devices/:id/preferences-layout",
    (req: Request, res: Response) => {
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
    }
  );

  app.get("/api/device-handlers", (req: Request, res: Response) => {
    let filter: string;
    if (typeof req.query.filter === "string") {
      filter = req.query.filter;
    }

    let fields: string[];
    if (Array.isArray(req.query.field)) {
      fields = req.query.field as string[];
    }

    let deviceHandlers = deviceService.getDeviceHandlers();

    if (fields != null && fields.length > 0) {
      let dhList: any[] = [];
      deviceHandlers.forEach((dh) => {
        let dhInfo: any = {};
        fields.forEach((field) => {
          switch (field) {
            case "id":
              dhInfo.id = dh.id;
              break;
            case "name":
              dhInfo.name = dh.name;
              break;
            case "namespace":
              dhInfo.namespace = dh.namespace;
              break;
            case "tags":
              dhInfo.tags = dh.tags;
          }
        });
        dhList.push(dhInfo);
      });

      res.json(dhList);
    } else {
      res.json(deviceHandlers);
    }
  });

  app.get(
    "/api/device-handlers/:id/preferences-layout",
    (req: Request, res: Response) => {
      // get device handler preferences.
      let id: string = req.params.id;
      let pageInfo = entityService.getDeviceHandlerPreferencesLayout(id);
      if (pageInfo == null) {
        pageInfo = {};
      }
      res.json(pageInfo);
    }
  );

  app.post(
    "/api/installed-smart-apps/:id/methods/:method",
    (req: Request, res: Response) => {
      const installedSmartAppId = req.params.id;
      const method = req.params.method;

      let prom: Promise<any> = entityService.runSmartAppMethod(
        installedSmartAppId,
        method,
        null
      );
      prom
        .then(() => {
          res.status(200).end();
        })
        .catch((err) => {
          console.log(err);
          res.status(500).end();
        });
    }
  );
};
