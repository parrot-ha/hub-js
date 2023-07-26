import { Request, Response } from "express";
import { IntegrationService } from "../../integration/integration-service";
import { AbstractIntegration } from "../../integration/abstract-integration";
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

    // ctx.contentType("application/json");
    // ctx.result(new JsonBuilder(integrationModel).toString());
    //res.json(integrationModel);
    res.status(status).json(integrationModel);
  });

  return router;
};
