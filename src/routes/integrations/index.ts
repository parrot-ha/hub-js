import { Request, Response } from "express";
import { IntegrationService } from "../../integration/integration-service";
import { AbstractIntegration } from "../../integration/abstract-integration";
import { ResetIntegrationExtension } from "../../integration/reset-integration-extension";
import { DeviceIntegration } from "../../integration/device-integration";

const express = require("express");

module.exports = function (integrationService: IntegrationService) {
  const router = express.Router();
  router.get("/", (req: Request, res: Response) => {
    let integrationType: string = req.query.type as string;
    let fields: string[] = null;
    if (Array.isArray(req.query.field)) {
      fields = req.query.field as string[];
    }

    let integrations = integrationService.getIntegrationConfigurations();

    if (fields?.length > 0) {
      let integrationList: any[] = [];
      integrations.forEach((integration) => {
        let abstractIntegration: AbstractIntegration =
          integrationService.getIntegrationById(integration.id);
        if (
          integrationType == null ||
          ("DEVICE" === integrationType &&
            abstractIntegration instanceof DeviceIntegration)
        ) {
          let integrationMap: any = {};
          fields.forEach((field) => {
            switch (field) {
              case "id":
                integrationMap.id = integration.id;
                break;
              case "name":
                integrationMap.name = integration.name;
                break;
              case "label":
                integrationMap.label = integration.label || integration.name;
                break;
              case "tags":
                integrationMap.tags =
                  abstractIntegration != null
                    ? (abstractIntegration as DeviceIntegration).tags
                    : [];
              case "description":
                integrationMap.description =
                  abstractIntegration?.description || "Not Found";
            }
          });

          integrationList.push(integrationMap);
        }
      });
      res.json(integrationList);
    } else {
      let integrationList: Map<string, any>[] = [];

      integrations.forEach((integration) => {
        integrationList.push(integration.getDisplayValues());
      });

      res.json(integrationList);
    }
  });

  router.post("/", (req: Request, res: Response) => {
    //String body = ctx.body();
    //Map bodyMap = (Map) (new JsonSlurper().parseText(body));
    let bodyMap = req.body;
    let integrationTypeId: string = bodyMap.id;

    let integrationModel: any = {};
    integrationModel.message = "";
    let integrationId: string = "";

    //ctx.status(200);
    let status = 200;
    try {
      integrationId = integrationService.createIntegration(integrationTypeId);
    } catch (err) {
      //TODO: allow other error codes.
      //ctx.status(500);
      //res.status(500);
      status = 500;
      //TODO: return a descriptive message
      integrationModel.message = "Error occurred: " + err.message;
    }
    integrationModel.id = integrationId;

    res.status(status).json(integrationModel);
  });

  router.get("/:id", (req: Request, res: Response) => {
    let integrationModel: any = {};
    let id: string = req.params.id;

    let abstractIntegration: AbstractIntegration =
      integrationService.getIntegrationById(id);

    if (abstractIntegration != null) {
      integrationModel["name"] = abstractIntegration.name;
      integrationModel["label"] = abstractIntegration.label;

      integrationModel["information"] = abstractIntegration.displayInformation;

      let features: any = {};
      if (integrationService.isResetIntegrationExtension(abstractIntegration)) {
        let options = {
          resetWarning: (
            abstractIntegration as ResetIntegrationExtension
          ).getResetWarning(),
        };
        features["reset"] = options;
      }
      if (
        integrationService.isDeviceScanIntegrationExtension(abstractIntegration)
      ) {
        features["deviceScan"] = null;
      }

      // if (abstractIntegration instanceof DeviceExcludeIntegrationExtension) {
      //     features.put("deviceExclude", null);
      // }
      // if (abstractIntegration instanceof ItemListIntegrationExtension) {
      //     features.put("itemList", null);
      // }
      integrationModel["features"] = features;
    }
    res.json(integrationModel);
    // ctx.status(200);
    // ctx.contentType("application/json");
    // ctx.result(new JsonBuilder(integrationModel).toString());
  });

  router.post("/:id/features/:feature", (req: Request, res: Response) => {
    let id: string = req.params.id;

    let feature: string = req.params.feature;
    let bodyMap = req.body;
    let action: string = bodyMap.action;
    let options: any = bodyMap.options;

    let response: any = null;
    switch (feature) {
      case "deviceScan":
        response = handleDeviceScanFeature(
          integrationService,
          id,
          action,
          options
        );
        break;
      // case "deviceExclude":
      //     response = handleDeviceExcludeFeature(id, action, options);
      //     break;
      case "reset":
        response = handleResetFeature(integrationService, id, action, options);
        break;
    }

    if (response instanceof Promise) {
      response
        .then((data) => {
          res.json({ response: data });
        })
        .catch((err) => {
          res.json({ response: false });
        });
    } else {
      res.json({ response: response });
    }
  });

  router.get("/:id/settings", (req: Request, res: Response) => {
    let id: string = req.params.id;
    let settingsMap = new Map<string, any>();
    let abstractIntegration: AbstractIntegration =
      integrationService.getIntegrationById(id);

    if (abstractIntegration != null) {
      let settings = abstractIntegration.getSettings();
      if (settings != null) {
        settings.forEach((setting) =>
          settingsMap.set(setting.name, setting.toJSON(true))
        );
      }
    }
    res.json(Object.fromEntries(settingsMap));
  });

  router.post("/:id/settings", (req: Request, res: Response) => {
    let id: string = req.params.id;
    let bodyMap = req.body;
    integrationService.updateIntegrationSettings(id, bodyMap);

    res.json({ success: true });
  });

  router.delete("/:id", (req: Request, res: Response) => {
    let id: string = req.params.id;
    integrationService.removeIntegration(id).then((integrationRemoved) => {
      res.json({ success: integrationRemoved });
    });
  });

  router.get("/:id/preferences-layout", (req: Request, res: Response) => {
    let id: string = req.params.id;
    let abstractIntegration: AbstractIntegration =
      integrationService.getIntegrationById(id);

    if (abstractIntegration != null) {
      let preferencesLayout = abstractIntegration.getPreferencesLayout();
      res.json(preferencesLayout);
    } else {
      res.status(404).end();
    }
  });

  router.get("/:id/page-layout", (req: Request, res: Response) => {
    let id: string = req.params.id;
    let abstractIntegration: AbstractIntegration =
      integrationService.getIntegrationById(id);

    if (abstractIntegration != null) {
      let pageLayout = abstractIntegration.getPageLayout();

      res.json(pageLayout);
    } else {
      res.status(404).end();
    }
  });

  router.get("/:id/page-data", (req: Request, res: Response) => {
    let id: string = req.params.id;
    let abstractIntegration: AbstractIntegration =
      integrationService.getIntegrationById(id);

    if (abstractIntegration != null) {
      let pageData = abstractIntegration.getPageData();

      res.json(pageData);
    } else {
      res.status(404).end();
    }
  });

  router.post("/:id/button-action", (req: Request, res: Response) => {
    let id: string = req.params.id;
    let abstractIntegration: AbstractIntegration =
      integrationService.getIntegrationById(id);

    if (abstractIntegration != null) {
      let bodyMap = req.body;
      let action = bodyMap.get("action");
      let responseData = abstractIntegration.processButtonAction(action);

      res.json({ success: true, responseData: responseData });
    } else {
      res.status(404).end();
    }
  });

  return router;
};

function handleResetFeature(
  integrationService: IntegrationService,
  integrationId: string,
  action: string,
  options: any
): Promise<boolean> | boolean {
  let abstractIntegration: AbstractIntegration =
    integrationService.getIntegrationById(integrationId);
  if (abstractIntegration == null) {
    return false;
  }
  if (integrationService.isResetIntegrationExtension(abstractIntegration)) {
    if ("reset" === action) {
      return abstractIntegration.reset();
    }
  }
  return false;
}

function handleDeviceScanFeature(
  integrationService: IntegrationService,
  integrationId: string,
  action: string,
  options: Object
) {
  let abstractIntegration: AbstractIntegration =
    integrationService.getIntegrationById(integrationId);
  if (abstractIntegration == null) {
    return null;
  }
  if (
    integrationService.isDeviceScanIntegrationExtension(abstractIntegration)
  ) {
    if ("startScan" === action) {
      abstractIntegration.startScan(options);
    } else if ("stopScan" === action) {
      abstractIntegration.stopScan(options);
    } else if ("getScanStatus" === action) {
      return abstractIntegration.getScanStatus(options);
    }
  }
  return null;
}
