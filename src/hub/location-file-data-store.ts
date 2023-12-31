import { LocationDataStore } from "./location-data-store";
import { Hub } from "./models/hub";
import { Location } from "./models/location";
import YAML from "yaml";
import fs from "fs";
import { Mode } from "./models/mode";

export class LocationFileDataStore implements LocationDataStore {
  private _location: Location;
  private _hub: Hub;

  public getLocation(): Location {
    if (this._location == null) {
      this.loadLocation();
    }
    return this._location;
  }

  public getHub(): Hub {
    if (this._hub == null) {
      this.loadHub();
    }
    return this._hub;
  }

  saveLocation(location: Location): void {
    this._location = location;
    try {
      fs.writeFile(
        "userData/config/location.yaml",
        YAML.stringify(this._location),
        (err: any) => {
          if (err) throw err;
          return true;
        }
      );
    } catch (err) {
      console.log("error when saving location config file", err);
    }
  }

  saveHub(hub: Hub): void {
    this._hub = hub;
    try {
      fs.writeFile(
        "userData/config/hub.yaml",
        YAML.stringify(this._hub),
        (err: any) => {
          if (err) throw err;
        }
      );
    } catch (err) {
      console.log("error when saving hub config file", err);
    }
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
        return null;
      }
    } catch (err) {
      console.log(err);
      return null;
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
        return null
      }
    } catch (err) {
      console.log(err);
      return null;
    }
  }
}
