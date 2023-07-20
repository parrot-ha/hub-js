import { Hub } from "./models/hub";
import { Location } from "./models/location";
import YAML from "yaml";
import fs from "fs";
import { randomUUID } from "crypto";
import { Mode } from "./models/mode";
const SunCalc = require("suncalc");

export class LocationService {
  _location: Location;
  _hub: Hub;

  public get location(): Location {
    if (this._location == null) {
      this.loadLocation();
    }
    return this._location;
  }

  public get hub(): Hub {
    if (this._hub == null) {
      this.loadHub();
    }
    return this._hub;
  }

  private loadLocation(): void {
    try {
      const locationConfig = fs.readFileSync(
        "userData/config/location.yaml",
        "utf-8"
      );
      if (locationConfig) {
        let parsedFile = YAML.parse(locationConfig);
        let location = new Location();
        location.id = parsedFile.id;
        location.temperatureScale = parsedFile.temperatureScale;
        location.latitude = parsedFile.latitude;
        location.longitude = parsedFile.longitude;
        location.name = parsedFile.name;
        location.zipCode = parsedFile.zipCode;
        if (parsedFile.modes) {
          location.modes = [];
          parsedFile.modes.forEach((element: any) => {
            location.modes.push(new Mode(element.id, element.name));
          });
          location.modes.forEach((mode: Mode) => {
            if (mode.name === parsedFile.currentMode.name) {
              location.currentMode = mode;
            }
          });
        }
        this._location = location;
      } else {
        this.createDefaultLocation();
      }
    } catch (err) {
      console.log(err);
      this.createDefaultLocation();
    }
  }

  private loadHub(): void {
    try {
      const hubConfig = fs.readFileSync("userData/config/hub.yaml", "utf-8");
      if (hubConfig) {
        let parsedFile = YAML.parse(hubConfig);
        let hub = new Hub();
        hub.id = parsedFile.id;
        hub.name = parsedFile.name;
        hub.hardwareID = parsedFile.hardwareID;
        hub.type = parsedFile.type;

        this._hub = hub;
      } else {
        this.createDefaultHub();
      }
    } catch (err) {
      console.log(err);
      this.createDefaultHub();
    }
  }

  private createDefaultLocation(): void {
    let location: Location = new Location();
    location.id = randomUUID();
    location.temperatureScale = "F";
    location.latitude = 40.748267;
    location.longitude = -73.985472;
    location.zipCode = "10001";
    location.name = "Default";
    location.currentMode = new Mode(randomUUID(), "Day");
    let modes: Mode[] = [];
    modes.push(location.currentMode);
    modes.push(new Mode(randomUUID(), "Evening"));
    modes.push(new Mode(randomUUID(), "Night"));
    modes.push(new Mode(randomUUID(), "Away"));
    location.modes = modes;
    this._location = location;
    this.saveLocation();
  }

  private createDefaultHub(): void {
    let hub: Hub = new Hub();
    hub.id = randomUUID();
    hub.name = this.location.name;
    hub.type = "PHYSICAL";
    hub.hardwareID = "UNKNOWN";

    this._hub = hub;
    this.saveHub();
  }

  public saveLocation(): boolean {
    try {
      fs.writeFile(
        "userData/config/location.yaml",
        YAML.stringify(this.location),
        (err: any) => {
          if (err) throw err;
          console.log("location config file has been saved!");
          return true;
        }
      );
    } catch (err) {
      console.log("error when saving location config file", err);
    }
    return false;
  }

  public saveHub(): void {
    try {
      fs.writeFile(
        "userData/config/hub.yaml",
        YAML.stringify(this.hub),
        (err: any) => {
          if (err) throw err;
          console.log("hub config file has been saved!");
        }
      );
    } catch (err) {
      console.log("error when saving hub config file", err);
    }
  }

  public getSunriseAndSunset(options: any): { sunrise: Date; sunset: Date } {
    let latitude = null;
    let longitude = null;

    //TODO: handle options
    // let zipCode = options?.get("zipCode")?.toString();
    // if (zipCode != null && zipCode.trim().length > 0) {
    //     // TODO: use a map of zip codes to lat/long to get date time.
    //     throw new Error("Sunrise/Sunset by zip code not implemented yet.");
    // }
    let sunriseOffset = 0;
    let sunsetOffset = 0;
    // let sunriseOffset = HubUtils.timeOffset(options.get("sunriseOffset"));
    // let sunsetOffset = HubUtils.timeOffset(options.get("sunsetOffset"));

    if (latitude == null && longitude == null && this.location != null) {
      latitude = this.location.latitude;
      longitude = this.location.longitude;
    }

    let sunriseSunsetObj: { sunrise: Date; sunset: Date } = {
      sunrise: null,
      sunset: null,
    };

    if (latitude != null && longitude != null) {
      var times = SunCalc.getTimes(new Date(), latitude, longitude);

      //TODO: should we return the rest of the values from suncalc module?
      if (times.sunrise != null)
        sunriseSunsetObj.sunrise = new Date(
          times.sunrise.getTime() + sunriseOffset
        );

      if (times.sunset != null)
        sunriseSunsetObj.sunset = new Date(
          times.sunset.getTime() + sunsetOffset
        );
    }
    return sunriseSunsetObj;
  }

  // public void calculateSunriseAndSunset() {
  //     ZonedDateTime dateTime = ZonedDateTime.now();// date, time and timezone of calculation
  //     dateTime = dateTime.withHour(0);

  //     if (getLocation() != null && getLocation().getLatitude() != null && getLocation().getLongitude() != null) {
  //         //double lat, lng = // geolocation
  //         SunTimes times = SunTimes.compute()
  //                 .on(dateTime)   // set a date
  //                 .at(getLocation().getLatitude().doubleValue(), getLocation().getLongitude().doubleValue())   // set a location
  //                 .execute();     // get the results
  //     }
  // }
}
