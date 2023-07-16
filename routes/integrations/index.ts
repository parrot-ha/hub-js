import { DeviceService } from "../../services/device-service";
import { EntityService } from "../../services/entity-service";
import { Request, Response } from "express";

const express = require("express");

module.exports = function () {
  const router = express.Router();
  router.get("/", (req: Request, res: Response) => {
    //let integrationType: string = req.query.type;
    let fields: string[] = null;
    if (Array.isArray(req.query.field)) {
      fields = req.query.field as string[];
    }

    //Collection<IntegrationConfiguration> integrations = integrationService.getIntegrations();

    if (fields?.length > 0) {
      let integrationList: Map<string, any>[] = [];
      // for (IntegrationConfiguration integration : integrations) {
      //     AbstractIntegration abstractIntegration = integrationService.getIntegrationById(integration.getId());
      //     if (integrationType == null || ("DEVICE".equals(integrationType) && abstractIntegration instanceof DeviceIntegration)) {
      //         Map<String, Object> integrationMap = new HashMap<>();
      //         for (String field : fields) {
      //             switch (field) {
      //                 case "id":
      //                     integrationMap.put("id", integration.getId());
      //                     break;
      //                 case "name":
      //                     integrationMap.put("name", integration.getName());
      //                     break;
      //                 case "label":
      //                     integrationMap.put("label", integration.getLabel() != null ? integration.getLabel() : integration.getName());
      //                     break;
      //                 case "tags":
      //                     integrationMap.put("tags",
      //                             abstractIntegration != null ? ((DeviceIntegration) abstractIntegration).getTags() : new ArrayList<>());
      //                 case "description":
      //                     integrationMap.put("description",
      //                             abstractIntegration != null ? abstractIntegration.getDescription() : "Not Found");
      //             }
      //         }

      //         integrationList.add(integrationMap);
      //     }
      // }
      res.json(integrationList);
    } else {
      let integrationList: Map<string, any>[] = [];

      // for (IntegrationConfiguration integration : integrations) {
      //     integrationList.add(integration.getDisplayValues());
      // }

      res.json(integrationList);
    }
  });

  return router;
};
