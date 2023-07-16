import { Application, Request, Response } from "express";
import { DeviceService } from "../services/device-service";
import { EntityService } from "../services/entity-service";
// import { Device } from "../models/device";
// import { DeviceHandler } from "../models/device-handler";
// import { Command } from "../models/command";
// import { Capability } from "../models/capability";
// import { Capabilities } from "../models/capabilities";
// import { DeviceSetting } from "../models/device-setting";

module.exports = function (
  app: Application,
  deviceService: DeviceService,
  entityService: EntityService
) {
  //TODO: move these to separate route directories and move functionality to controllers
  //https://medium.com/@sesitamakloe/how-we-structure-our-express-js-routes-58933d02e491

  app.use("/api/devices", require("./devices")(deviceService, entityService));
  app.use(
    "/api/device-handlers",
    require("./device-handlers")(deviceService, entityService)
  );
  app.use("/api/integrations", require("./integrations")());

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
