import { DeviceSetting } from "../device/models/device-setting";
import { Device } from "../device/models/device";

export function buildDeviceSettingsHandler(device: Device) {
  return {
    settingsCache: {},
    devSettings: device.settings || [],
    get(target: any, prop: any): any {
      let settingLookupVal = this.settingsCache[prop];
      if (typeof settingLookupVal === "undefined") {
        let deviceSetting: DeviceSetting = this.devSettings.find(
          (element: DeviceSetting) => element.name == prop
        );
        if (typeof deviceSetting != "undefined") {
          settingLookupVal = deviceSetting.getValueAsType();
          this.settingsCache[prop] = settingLookupVal;
        }
      }
      return settingLookupVal ? settingLookupVal : null;
    },
  };
}
