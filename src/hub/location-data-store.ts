import { Hub } from "./models/hub";
import { Location } from "./models/location";

export interface LocationDataStore {
  getHub(): Hub;
  getLocation(): Location;
  saveLocation(location: Location): void;
  saveHub(hub: Hub): void;
}
