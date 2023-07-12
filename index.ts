import express, { Application, Request, Response } from "express";
const fs = require("fs");
const path = require("path");
const { NodeVM } = require("vm2");

import { DeviceService } from "./services/device-service";
import { ServiceFactory } from "./services/service-factory";
import { setupSystem, shutdownSystem } from "./services/system-setup";

let deviceService: DeviceService =
  ServiceFactory.getInstance().getDeviceService();

// set up system for running
setupSystem();

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

// include routes/controllers
require("./routes")(app);

const port = process.env.PORT || 6501;
const server = app.listen(port, () => {
  console.log(`listening on ${port}`);
});

const exitFunction = () => {
  shutdownSystem();
  server.close(() => process.exit(0));
};

process.on("SIGTERM", exitFunction);
process.on("SIGINT", exitFunction);
