import { Hub } from "./models/hub";
import { Location } from "./models/location";
import { randomUUID } from "crypto";
import { Mode } from "./models/mode";
import { toInteger } from "../utils/object-utils";
import { LocationDataStore } from "./location-data-store";
import { timeOffset } from "../utils/time-utils";

const SunCalc = require("suncalc");

export class LocationService {
  _location: Location;
  _hub: Hub;
  private _locationDataStore: LocationDataStore;

  constructor(locationDataStore: LocationDataStore) {
    this._locationDataStore = locationDataStore;
  }

  public getLocation(): Location {
    let location = this._locationDataStore.getLocation();
    if (!location) {
      location = this.createDefaultLocation();
      this._locationDataStore.saveLocation(location);
    }
    return location;
  }

  public getHub(): Hub {
    let hub = this._locationDataStore.getHub();
    if (!hub) {
      hub = this.createDefaultHub();
      this._locationDataStore.saveHub(hub);
    }
    return hub;
  }

  public saveLocation(location: Location): void {
    this._locationDataStore.saveLocation(location);
  }

  public saveHub(hub: Hub): void {
    this._locationDataStore.saveHub(hub);
  }

  private createDefaultLocation(): Location {
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
    return location;
  }

  private createDefaultHub(): Hub {
    let hub: Hub = new Hub();
    hub.id = randomUUID();
    hub.name = this.getLocation().name;
    hub.type = "PHYSICAL";
    hub.hardwareID = "UNKNOWN";

    return hub;
  }

  public getSunriseAndSunset(options: any): { sunrise: Date; sunset: Date } {
    let latitude = null;
    let longitude = null;

    let sunriseOffset = timeOffset(options?.sunriseOffset) || 0;
    let sunsetOffset = timeOffset(options?.sunsetOffset) || 0;

    if (latitude == null && longitude == null && this.getLocation() != null) {
      latitude = this.getLocation().latitude;
      longitude = this.getLocation().longitude;
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
          times.sunrise.getTime() + sunriseOffset,
        );

      if (times.sunset != null)
        sunriseSunsetObj.sunset = new Date(
          times.sunset.getTime() + sunsetOffset,
        );
    }
    return sunriseSunsetObj;
  }
}
