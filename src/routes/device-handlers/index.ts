import { DeviceHandlerType } from "../../device/models/device-handler";
import { DeviceService } from "../../device/device-service";
import { EntityService } from "../../entity/entity-service";
import { Request, Response } from "express";

const express = require("express");

module.exports = function (
  deviceService: DeviceService,
  entityService: EntityService
) {
  const router = express.Router();
  router.get("/", (req: Request, res: Response) => {
    let filter: string;
    if (typeof req.query.filter === "string") {
      filter = req.query.filter;
    }

    let fields: string[];
    if (Array.isArray(req.query.field)) {
      fields = req.query.field as string[];
    }

    let deviceHandlers = deviceService.getDeviceHandlers();

    //let filteredDeviceHandlers = deviceHandlers;
    if (filter === "user") {
      deviceHandlers = deviceHandlers.filter((dh) => dh.type === DeviceHandlerType.USER);
    }
    if (fields != null && fields.length > 0) {
      let dhList: any[] = [];
      deviceHandlers.forEach((dh) => {
        let dhInfo: any = {};
        fields.forEach((field) => {
          switch (field) {
            case "id":
              dhInfo.id = dh.id;
              break;
            case "name":
              dhInfo.name = dh.name;
              break;
            case "namespace":
              dhInfo.namespace = dh.namespace;
              break;
            case "tags":
              dhInfo.tags = dh.tags;
          }
        });
        dhList.push(dhInfo);
      });

      res.json(dhList);
    } else {
      res.json(deviceHandlers);
    }
  });

  router.get("/:id/preferences-layout", (req: Request, res: Response) => {
    // get device handler preferences.
    let id: string = req.params.id;
    let pageInfo = entityService.getDeviceHandlerPreferencesLayout(id);
    if (pageInfo == null) {
      pageInfo = {};
    }
    res.json(pageInfo);
  });
  return router;
};
