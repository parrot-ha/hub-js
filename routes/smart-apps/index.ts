import { Request, Response } from "express";
import { SmartAppService } from "../../services/smart-app-service";
import { EntityService } from "../../services/entity-service";
import { SmartApp, SmartAppType } from "../../models/smart-app";
import { randomUUID } from "crypto";
import { SmartAppInUseError } from "../../errors/smart-app-in-use-error";

const express = require("express");

module.exports = function (
  smartAppService: SmartAppService,
  entityService: EntityService
) {
  const router = express.Router();

  router.get("/", (req: Request, res: Response) => {
    let filter: string = req.query?.filter?.toString();

    let sas: SmartApp[] = smartAppService.getSmartApps();

    if (filter === "user") {
      sas = sas.filter((sa) => sa.type === SmartAppType.USER && !sa.parent);
    } else {
      sas = sas.filter((sa) => !sa.parent);
    }

    res.json(sas);
  });

  router.get("/:id", (req: Request, res: Response) => {
    let id: string = req.params.id;

    let smartApp: SmartApp = smartAppService.getSmartApp(id);
    let response = {
      id: id,
      version: "1",
      name: smartApp.name,
      namespace: smartApp.namespace,
      oAuthEnabled: smartApp.oAuthEnabled,
      oAuthClientId: smartApp.oAuthClientId,
      oAuthClientSecret: smartApp.oAuthClientSecret,
    };
    res.json(response);
  });

  router.put("/:id", (req: Request, res: Response) => {
    let id: string = req.params.id;

    let smartAppSaved: boolean = false;
    let smartAppMap: any = req.body;

    let smartApp: SmartApp = smartAppService.getSmartApp(id);

    if (smartApp != null) {
      if (smartAppMap.containsKey("oAuthEnabled")) {
        if (smartAppMap.get("oAuthEnabled") instanceof Boolean) {
          if (smartAppMap.get("oAuthEnabled") && !smartApp.oAuthEnabled) {
            console.log("OAuth enabled! " + smartAppMap.get("oAuthEnabled"));
            smartApp.oAuthClientId = randomUUID();
            smartApp.oAuthClientSecret = randomUUID();
          }
        }
      }
      smartAppService.updateSmartApp(smartApp);
    }

    res.json({ success: true });
  });

  router.get("/:id/source", (req: Request, res: Response) => {
    let id: string = req.params.id;
    let sourceCode: string = smartAppService.getSmartAppSourceCode(id);
    let response = {
      id: id,
      version: "1",
      status: "published",
      sourceCode: sourceCode,
    };

    res.json(response);
  });

  router.put("/:id/source", (req: Request, res: Response) => {
    let id: string = req.params.id;
    let bodyMap: any = req.body;

    let sourceCode: string = bodyMap.sourceCode;
    try {
      let response: boolean = entityService.updateSmartAppSourceCode(
        id,
        sourceCode
      );
      res.json({ success: response });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  });

  router.delete("/:id", (req: Request, res: Response) => {
    let id: string = req.params.id;
    try {
      let response: boolean = entityService.removeSmartApp(id);
      res.json({ success: response });
    } catch (err) {
      if (err instanceof SmartAppInUseError) {
        let errorMsg =
          "Cannot delete smart app, it is in use by the following installed smart apps: ";
        err.installedSmartApps?.forEach((isa) =>
          errorMsg.concat(isa.displayName, ", ")
        );
        errorMsg = errorMsg.substring(0, errorMsg.length - 2);
        res.json({ success: false, message: errorMsg });
      } else {
        res.json({ success: false, message: err.message });
      }
    }
  });

  // create new automation app from source code
  router.post("/source", (req: Request, res: Response) => {
    let bodyMap: any = req.body;
    let sourceCode: string = bodyMap.sourceCode;
    try {
      //save source code
      let saId: string = smartAppService.addSmartAppSourceCode(sourceCode);

      if (saId != null) {
        res.json({ success: true, saId: saId });
      } else {
        res.json({ success: false, message: "Unable to save Smart App" });
      }
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  });

  return router;
};
