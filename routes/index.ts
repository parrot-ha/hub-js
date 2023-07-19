import { Application, Request, Response } from "express";
import { DeviceService } from "../services/device-service";
import { SmartAppService } from "../services/smart-app-service";
import { EntityService } from "../services/entity-service";
import { LocationService } from "../services/location-service";

module.exports = function (
  app: Application,
  deviceService: DeviceService,
  smartAppService: SmartAppService,
  entityService: EntityService,
  locationService: LocationService
) {
  //TODO: move these to separate route directories and move functionality to controllers
  //https://medium.com/@sesitamakloe/how-we-structure-our-express-js-routes-58933d02e491

  app.use("/api/devices", require("./devices")(deviceService, entityService));
  app.use(
    "/api/device-handlers",
    require("./device-handlers")(deviceService, entityService)
  );
  app.use("/api/integrations", require("./integrations")());
  app.use("/api/location", require("./location")(locationService));
  app.use(
    "/api/installed-smart-apps",
    require("./installed-smart-apps")(smartAppService)
  );
  app.use(
    "/api/smart-apps",
    require("./smart-apps")(smartAppService, entityService)
  );
};
