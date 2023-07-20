import express, { Application } from "express";
import { ServiceFactory } from "./hub/service-factory";
import { setupSystem, shutdownSystem } from "./hub/hub-setup";
import WebSocket from "ws";
const logger = require("./services/logger-service")({ source: "main" });

// set up system for running
setupSystem();

const app: Application = express();

app.use(express.json()); // for parsing application/json

// include routes/controllers
require("./routes")(
  app,
  ServiceFactory.getInstance().getDeviceService(),
  ServiceFactory.getInstance().getSmartAppService(),
  ServiceFactory.getInstance().getEntityService(),
  ServiceFactory.getInstance().getLocationService()
);

const port = process.env.PORT || 6501;
const server = app.listen(port, () => {
  logger.info(`listening on ${port}`);
});

const websocketServer: WebSocket.Server = require("./routes/websocket")(
  server,
  ServiceFactory.getInstance().getEntityService()
);

const exitFunction = () => {
  logger.debug("starting shut down");
  websocketServer.clients?.forEach((ws: WebSocket) => {
    ws.close();
  });
  websocketServer.close();
  shutdownSystem().then(() => {
    server.close(() => {
      logger.debug("finished shut down");
      process.exit(0);
    });
  });
};

process.on("SIGINT", exitFunction);
process.on("SIGTERM", exitFunction);
