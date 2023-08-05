import { DeviceHandlerType } from "../../device/models/device-handler";
import { DeviceService } from "../../device/device-service";
import { EntityService } from "../../entity/entity-service";
import { Request, Response } from "express";
import { DeviceHandlerInUseError } from "../../device/errors/device-handler-in-use-error";

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
      deviceHandlers = deviceHandlers.filter(
        (dh) => dh.type === DeviceHandlerType.USER
      );
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

  router.get("/:id/source", (req: Request, res: Response) => {
    let id: string = req.params.id;
    let sourceCode: string = deviceService.getDeviceHandlerSourceCode(id);
    // todo: handle published and version
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
      let response: boolean = entityService.updateDeviceHandlerSourceCode(
        id,
        sourceCode
      );
      res.json({ success: response });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  });

  // create new device handler from source code
  router.post("/source", (req: Request, res: Response) => {
    let bodyMap: any = req.body;
    let sourceCode: string = bodyMap.sourceCode;
    try {
      //save source code
      let dhId: string = deviceService.addDeviceHandlerSourceCode(sourceCode);

      if (dhId != null) {
        res.json({ success: true, id: dhId });
      } else {
        res.json({ success: false, message: "Unable to save Device Handler" });
      }
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  });

  router.delete("/:id", (req: Request, res: Response) => {
    let id: string = req.params.id;
    try {
      let response: boolean = entityService.removeDeviceHandler(id);
      res.json({ success: response });
    } catch (err) {
      if (err instanceof DeviceHandlerInUseError) {
        let errorMsg =
          "Cannot delete device handler, it is in use by the following devices: ";
        err.devices?.forEach((dev) => errorMsg.concat(dev.displayName, ", "));
        errorMsg = errorMsg.substring(0, errorMsg.length - 2);
        res.json({ success: false, message: errorMsg });
      } else {
        res.json({ success: false, message: err.message });
      }
    }
  });

  return router;
};
