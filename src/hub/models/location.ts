import { Hub } from "./hub";
import { Mode } from "./mode";

export class Location {
  id: string;
  temperatureScale: string;
  currentMode: Mode;
  latitude: number;
  longitude: number;
  name: string;
  zipCode: string;
  hub: Hub;
  modes: Mode[];

  public get timeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  public set modeId(modeId: string) {
    if (modeId == null) return;
    this.modes.forEach((modeItem: Mode) => {
      if (modeId === modeItem.id) {
        this.currentMode = modeItem;
        return;
      }
    });
  }
}
