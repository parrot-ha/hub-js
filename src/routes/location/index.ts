import { Request, Response } from "express";
import { LocationService } from "../../hub/location-service";
import { Location } from "../../hub/models/location";
import { Hub } from "../../hub/models/hub";
import { ServiceFactory } from "../../hub/service-factory";

const express = require("express");

module.exports = function (locationService: LocationService) {
  const router = express.Router();

  router.put("/", (req: Request, res: Response) => {
    let locationSaved: boolean = false;
    let jsonBodyObj: any = req.body;

    //TODO: validate these values
    if (jsonBodyObj != null && Object.keys(jsonBodyObj).length > 0) {
      let location: Location = locationService.getLocation();
      location.name = jsonBodyObj.name;
      location.temperatureScale = jsonBodyObj.temperatureScale;
      location.zipCode = jsonBodyObj.zipCode;
      location.latitude = jsonBodyObj.latitude;
      location.longitude = jsonBodyObj.longitude;
      location.modeId = jsonBodyObj.currentMode.id;
      locationService.saveLocation(location);
    }
    res.json({ success: true });
  });

  router.get("/", (req: Request, res: Response) => {
    let location: Location = locationService.getLocation();
    let model = {
      id: location.id,
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      zipCode: location.zipCode,
      timezone: location.timeZone,
      // Map<String, Date> sunriseSunset = locationService.getSunriseAndSunset(new HashMap<>());
      // model.put("sunrise", SimpleDateFormat.getTimeInstance().format(sunriseSunset.get("sunrise")));
      // model.put("sunset", SimpleDateFormat.getTimeInstance().format(sunriseSunset.get("sunset")));
      temperatureScale: location.temperatureScale,
      currentMode: location.currentMode,
      modes: location.modes,
    };

    res.json(model);
  });

  router.get("/schedules", (req: Request, res: Response) => {
    let ss = ServiceFactory.getInstance().getScheduleService();
    let scheds = ss?.getSchedules();
    res.json(scheds);
  });

  router.get("/hub", (req: Request, res: Response) => {
    let hub: Hub = locationService.getHub();
    let version = process.env.npm_package_version || 'unknown';
    res.json({ id: hub.id, name: hub.name, version: version });
  });

  return router;
};
