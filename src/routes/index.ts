import { Application, Request, Response } from "express";
import { DeviceService } from "../device/device-service";
import { SmartAppService } from "../smartApp/smart-app-service";
import { EntityService } from "../entity/entity-service";
import { LocationService } from "../hub/location-service";
import { IntegrationService } from "../integration/integration-service";

module.exports = function (
  app: Application,
  deviceService: DeviceService,
  smartAppService: SmartAppService,
  entityService: EntityService,
  locationService: LocationService,
  integrationService: IntegrationService
) {
  //TODO: move these to separate route directories and move functionality to controllers
  //https://medium.com/@sesitamakloe/how-we-structure-our-express-js-routes-58933d02e491

  app.use("/api/devices", require("./devices")(deviceService, entityService));
  app.use(
    "/api/device-handlers",
    require("./device-handlers")(deviceService, entityService)
  );
  app.use("/api/integrations", require("./integrations")(integrationService));
  app.use(
    "/api/integration_types",
    require("./integration-types")(integrationService)
  );
  app.use("/api/location", require("./location")(locationService));
  app.use(
    "/api/installed-smart-apps",
    require("./installed-smart-apps")(smartAppService, entityService)
  );
  app.use(
    "/api/smart-apps",
    require("./smart-apps")(smartAppService, entityService)
  );
};
