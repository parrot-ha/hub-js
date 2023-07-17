import { Request, Response } from "express";
import { LocationService } from "../../services/location-service";
import { Location } from "../../models/location";
import { Hub } from "../../models/hub";

const express = require("express");

module.exports = function (locationService: LocationService) {
  const router = express.Router();

  router.put("/", (req: Request, res: Response) => {
    let locationSaved: boolean = false;
    let jsonBodyObj: any = req.body;

    //TODO: validate these values
    if (jsonBodyObj != null && Object.keys(jsonBodyObj).length > 0) {
      let location: Location = locationService.location;
      location.name = jsonBodyObj.name;
      location.temperatureScale = jsonBodyObj.temperatureScale;
      location.zipCode = jsonBodyObj.zipCode;
      location.latitude = jsonBodyObj.latitude;
      location.longitude = jsonBodyObj.longitude;
      location.modeId = jsonBodyObj.currentMode.id;
      locationSaved = locationService.saveLocation();
    }
    res.json({ success: locationSaved });
  });

  router.get("/", (req: Request, res: Response) => {
    let location: Location = locationService.location;
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

  router.get("/hub", (req: Request, res: Response) => {
    let hub: Hub = locationService.hub;
    let version = process.env.npm_package_version || 'unknown';
    res.json({ id: hub.id, name: hub.name, version: version });
  });

  return router;
};
