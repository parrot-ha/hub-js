import { describe, expect, test } from "@jest/globals";
import { InstalledSmartAppSetting } from "./installed-smart-app-setting";

describe("Installed Smart App Settings tests", () => {
  test("installed smart app setting with string time from UI", () => {
    let installedSmartAppSetting: InstalledSmartAppSetting =
      new InstalledSmartAppSetting();
    installedSmartAppSetting.type = "time";
    installedSmartAppSetting.value = "";
    expect(
      installedSmartAppSetting.processValueTypeAndMultiple(
        "2023-10-13T12:55:37.625-00:00",
        "time",
        false
      )
    ).toBeUndefined();
    expect(installedSmartAppSetting.type).toBe("time");
    expect(installedSmartAppSetting.value).toBe("2023-10-13T12:55:37.625Z");
  });
  test("installed smart app setting with string time utc", () => {
    let installedSmartAppSetting: InstalledSmartAppSetting =
      new InstalledSmartAppSetting();
    installedSmartAppSetting.type = "time";
    installedSmartAppSetting.value = "";
    expect(
      installedSmartAppSetting.processValueTypeAndMultiple(
        "2023-10-13T12:55:37.625Z",
        "time",
        false
      )
    ).toBeUndefined();
    expect(installedSmartAppSetting.type).toBe("time");
    expect(installedSmartAppSetting.value).toBe("2023-10-13T12:55:37.625Z");
  });
  test("installed smart app setting with string time hour and minute", () => {
    let installedSmartAppSetting: InstalledSmartAppSetting =
      new InstalledSmartAppSetting();
    installedSmartAppSetting.type = "time";
    installedSmartAppSetting.value = "";
    expect(
      installedSmartAppSetting.processValueTypeAndMultiple(
        "06:12",
        "time",
        false
      )
    ).toBeUndefined();
    expect(installedSmartAppSetting.type).toBe("time");
    expect(installedSmartAppSetting.value).toBeDefined();
    let isasDate = new Date(installedSmartAppSetting.value);
    expect(isasDate.getHours()).toBe(6);
    expect(isasDate.getMinutes()).toBe(12);
  });
});
