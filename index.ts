import express, { Application, Request, Response } from "express";
const fs = require("fs");
const path = require("path");
const { NodeVM } = require("vm2");

import { DeviceService } from "./services/device-service";
import { ServiceFactory } from "./services/service-factory";
import { EventService } from "./services/event-service";
import { SmartAppService } from "./services/smart-app-service";
import { EntityService } from "./services/entity-service";

let deviceService: DeviceService =
  ServiceFactory.getInstance().getDeviceService();

let smartAppService: SmartAppService =
  ServiceFactory.getInstance().getSmartAppService();

let entityService: EntityService =
  ServiceFactory.getInstance().getEntityService();

let eventService: EventService = ServiceFactory.getInstance().getEventService();
eventService.addDeviceSubscription("123", "456", "contact", "myMethod", null);

const app: Application = express();
app.set("view engine", "ejs");
app.use(express.json()); // for parsing application/json

//TODO: these ejs pages are temporary until we get the real ui.

app.get("/", function (req: Request, res: Response) {
  res.render("pages/index");
});

app.get("/devices", function (req: Request, res: Response) {
  res.render("pages/devices", { devices: deviceService.getDevices() });
});

app.get("/devices/:id", function (req: Request, res: Response) {
  res.render("pages/device", deviceService.getDevice(req.params.id));
});

app.get("/add-device", function (req: Request, res: Response) {
  res.render("pages/add-device", {
    deviceHandlers: deviceService.getDeviceHandlers(),
  });
});

//TODO: move to routes/controllers

app.get("/api/devices", (req: Request, res: Response) => {
  res.json(deviceService.getDevices());
});

// add device
app.post("/api/devices", (req: Request, res: Response) => {
  let deviceParams = req.body;
  let deviceId = deviceService.addDevice(
    deviceParams.nameInput,
    deviceParams.label,
    deviceParams.deviceNetworkId,
    deviceParams.deviceType
  );
  res.json({ id: deviceId });
});

app.get("/api/devices/:id", (req: Request, res: Response) => {
  res.json(deviceService.getDevice(req.params.id));
});

app.get("/api/devices/:id/commands", (req: Request, res: Response) => {
  let deviceId = req.params.id;
  let device = deviceService.getDevice(deviceId);
  let deviceHandler = deviceService.getDeviceHandler(device.deviceHandlerId);
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

const port = process.env.PORT || 6501;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
