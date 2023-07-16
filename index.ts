import express, { Application, Request, Response } from "express";
import { DeviceService } from "./services/device-service";
import { ServiceFactory } from "./services/service-factory";
import { setupSystem, shutdownSystem } from "./services/system-setup";

let deviceService: DeviceService =
  ServiceFactory.getInstance().getDeviceService();

// set up system for running
setupSystem();

const app: Application = express();
app.use(express.json()); // for parsing application/json

// include routes/controllers
require("./routes")(
  app,
  ServiceFactory.getInstance().getDeviceService(),
  ServiceFactory.getInstance().getEntityService()
);

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
