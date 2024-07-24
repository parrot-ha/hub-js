import { Request, Response } from "express";
import { SmartAppService } from "../../smartApp/smart-app-service";
import { EntityService } from "../../entity/entity-service";
import { InstalledSmartApp } from "../../smartApp/models/installed-smart-app";
import { SmartApp } from "../../smartApp/models/smart-app";
import { InstalledSmartAppSetting } from "../../smartApp/models/installed-smart-app-setting";

const express = require("express");

module.exports = function (
  smartAppService: SmartAppService,
  entityService: EntityService
) {
  const router = express.Router();

  router.get("/", (req: Request, res: Response) => {
    let isaListData: any[] = [];
    let includeChildren: boolean = "true" === req.query?.includeChildren;

    let installedSmartApps: InstalledSmartApp[] =
      smartAppService.getInstalledSmartApps();

    installedSmartApps.forEach((isa: InstalledSmartApp) => {
      if (isa.parentInstalledSmartAppId == null || includeChildren) {
        let saInfo: SmartApp = smartAppService.getSmartApp(isa.smartAppId);
        let isaData: any = {
          id: isa.id,
          parentAppId: isa.parentInstalledSmartAppId,
          label: isa.label,
          type: saInfo.name,
        };

        isaListData.push(isaData);
      }
    });

    res.json(isaListData);
  });

  router.post("/", (req: Request, res: Response) => {
    let body = req.body;
    let type = body.type;

    let smartAppModel: any = { message: "" };
    let smartAppId = "";

    if ("child" == type) {
      let parentAppId = body.id;
      let appName = body.appName;
      let namespace = body.namespace;
      smartAppId = smartAppService.addChildInstalledSmartApp(
        parentAppId,
        appName,
        namespace
      );
    } else {
      let smartAppTypeId = body.id;
      smartAppId = smartAppService.addInstalledSmartApp(smartAppTypeId);
    }
    smartAppModel.id = smartAppId;

    res.json(smartAppModel);
  });

  router.get("/:id", (req: Request, res: Response) => {
    let id: string = req.params.id;
    let installedSmartApp: InstalledSmartApp =
      smartAppService.getInstalledSmartApp(id);

    let smartApp: SmartApp = smartAppService.getSmartApp(
      installedSmartApp.smartAppId
    );
    let model: any = {
      id: installedSmartApp.id,
      label: installedSmartApp.label,
      name: smartApp.name,
      namespace: smartApp.namespace,
      smartAppId: smartApp.id,
      settings: installedSmartApp.settings,
    };
    res.json(model);
  });

  // router.put("/:id", (req: Request, res: Response) => {
  //     let id: string = req.params.id;

  //     boolean installedSmartAppSaved = false;
  //     String body = ctx.body();

  //     if (StringUtils.isNotBlank(body)) {
  //         Object jsonBodyObj = new JsonSlurper().parseText(body);
  //         if (jsonBodyObj instanceof Map) {
  //             Map<String, Object> installedSmartAppMap = (Map<String, Object>) jsonBodyObj;
  //             InstalledSmartApp installedSmartApp = smartAppService.getInstalledSmartApp(id);

  //             if (installedSmartApp != null) {
  //                 if (installedSmartAppMap.containsKey("label")) {
  //                     installedSmartApp.setLabel((String) installedSmartAppMap.get("label"));
  //                 }
  //                 installedSmartAppSaved = smartAppService.updateInstalledSmartApp(installedSmartApp);

  //                 //TODO: run updated method
  //             }
  //         }
  //     }

  //     Map<String, Object> model = new HashMap<>();
  //     model.put("success", installedSmartAppSaved);
  //     ctx.status(200);
  //     ctx.contentType("application/json");
  //     ctx.result(new JsonBuilder(model).toString());
  // });

  // // remove an installed smart app
  router.delete("/:id", (req: Request, res: Response) => {
    let id: string = req.params.id;

    //run uninstalled method
    entityService
      .runSmartAppMethod(id, "uninstalled", null)
      .then(() => {
        let isaRemoved: boolean = smartAppService.deleteInstalledSmartApp(id);
        res.json({ success: isaRemoved });
      })
      .catch((err) => {
        //TODO: only handle missing method exception if its for a method other than uninstalled
        console.log(err);
        let isaRemoved: boolean = smartAppService.deleteInstalledSmartApp(id);
        res.json({ success: isaRemoved });
      });
  });

  router.post("/:id/methods/:method", (req: Request, res: Response) => {
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
  });

  router.get("/:id/schedules", (req: Request, res: Response) => {
      let id: string = req.params.id;
      let schedules = entityService.getSchedule("SMARTAPP", id);
      res.json(schedules);
  });

  // router.get("/:id/child-apps", (req: Request, res: Response) => {
  //     // get the installed child apps of an installed smart app
  //     let id: string = req.params.id;
  //     String appName = ctx.queryParam("appName");
  //     String namespace = ctx.queryParam("namespace");
  //     List<InstalledSmartApp> childApps = smartAppService.getChildInstalledSmartApps(id, appName, namespace);
  //     List<Map> childAppListMap = childApps.stream().map(ca -> Map.of("id", ca.getId(), "displayName", ca.getDisplayName()))
  //             .collect(Collectors.toList());
  //     ctx.status(200);
  //     ctx.contentType("application/json");
  //     ctx.result(new JsonBuilder(childAppListMap).toString());
  // });

  router.get("/:id/cfg/page", (req: Request, res: Response) => {
    // get first page of smart app configuration or if single page app, get that.
    let id: string = req.params.id;
    let pageInfo: any = entityService.getInstalledSmartAppConfigurationPage(
      id,
      null
    );
    res.json(pageInfo);
  });

  router.get("/:id/cfg/page/:pageName", (req: Request, res: Response) => {
    // get named page of smart app configuration.
    let id: string = req.params.id;
    let pageName = req.params.pageName;
    let pageInfo: any = entityService.getInstalledSmartAppConfigurationPage(
      id,
      pageName
    );
    res.json(pageInfo);
  });

  router.get("/:id/cfg/settings", (req: Request, res: Response) => {
    let id: string = req.params.id;
    let installedSmartApp: InstalledSmartApp =
      smartAppService.getInstalledSmartApp(id);

    let settings: InstalledSmartAppSetting[] = installedSmartApp.settings;

    let settingsMap: any = {};
    if (settings != null) {
      settings.forEach((setting) => {
        settingsMap[setting.name] = setting.toJSON(true);
      });
    }
    res.json(settingsMap);
  });

  // router.get("/:id/cfg/info", (req: Request, res: Response) => {
  //     let id: string = req.params.id;
  //     InstalledSmartApp installedSmartApp = smartAppService.getInstalledSmartApp(id);
  //     Map<String, Object> installedSmartAppInfo = new LinkedHashMap<>();
  //     installedSmartAppInfo.put("label", installedSmartApp.getLabel());

  //     //TODO: get mode info as well.
  //     installedSmartAppInfo.put("modes", new ArrayList<String>());

  //     ctx.status(200);
  //     ctx.contentType("application/json");
  //     ctx.result(new JsonBuilder(installedSmartAppInfo).toString());
  // });

  // // we are updating isa config and we are not done updating the cfg
  router.patch("/:id/cfg/settings", (req: Request, res: Response) => {
    let id: string = req.params.id;
    let updatedSettings = req.body;
    smartAppService.updateInstalledSmartAppSettings(id, updatedSettings);

    res.json({ success: true });
  });

  // // we are done updating an isa so run installed or updated depending
  router.post("/:id/cfg/settings", (req: Request, res: Response) => {
    let id: string = req.params.id;
    let updatedSettings = req.body;
    smartAppService.updateInstalledSmartAppSettings(id, updatedSettings);

    try {
      entityService.updateOrInstallInstalledSmartApp(id);
      res.json({ success: true });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  });

  return router;
};
