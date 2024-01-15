import { describe, expect, test } from "@jest/globals";
import { SmartAppDelegate } from "./smart-app-delegate";

describe("Test Smart App Delegate", () => {
  test("create page with name", () => {
    let samd = new SmartAppDelegate();
    samd.page("my page name");
    expect(samd.metadataValue.preferences).toBeDefined();
    expect(samd.metadataValue.preferences.pageList).toBeDefined();
    expect(samd.metadataValue.preferences.pageList).toBeInstanceOf(Array);
    expect(samd.metadataValue.preferences.pageList.length).toBe(1);
    let page = samd.metadataValue.preferences.pageList[0];
    expect(page).toBeDefined();
    expect(page.name).toBe("my page name");
    expect(page.title).toBeNull();
  });

  test("create page with name and title", () => {
    let samd = new SmartAppDelegate();
    samd.page("my page name", "my page title");
    expect(samd.metadataValue.preferences).toBeDefined();
    expect(samd.metadataValue.preferences.pageList).toBeDefined();
    expect(samd.metadataValue.preferences.pageList).toBeInstanceOf(Array);
    expect(samd.metadataValue.preferences.pageList.length).toBe(1);
    let page = samd.metadataValue.preferences.pageList[0];
    expect(page).toBeDefined();
    expect(page.name).toBe("my page name");
    expect(page.title).toBe("my page title");
  });

  test("create page with blank function", () => {
    let samd = new SmartAppDelegate();
    samd.page(() => {});
    expect(samd.metadataValue.preferences).toBeDefined();
    expect(samd.metadataValue.preferences.pageList).toBeDefined();
    expect(samd.metadataValue.preferences.pageList).toBeInstanceOf(Array);
    expect(samd.metadataValue.preferences.pageList.length).toBe(1);
    let page = samd.metadataValue.preferences.pageList[0];
    expect(page).toBeDefined();
    expect(page.name).toBeNull();
    expect(page.title).toBeNull();
  });

  test("create page with options and blank function", () => {
    let samd = new SmartAppDelegate();
    samd.page({ name: "my new name" }, () => {});
    expect(samd.metadataValue.preferences).toBeDefined();
    expect(samd.metadataValue.preferences.pageList).toBeDefined();
    expect(samd.metadataValue.preferences.pageList).toBeInstanceOf(Array);
    expect(samd.metadataValue.preferences.pageList.length).toBe(1);
    let page = samd.metadataValue.preferences.pageList[0];
    expect(page).toBeDefined();
    expect(page.name).toBe("my new name");
    expect(page.title).toBeNull();
  });

  test("create page with function containing section", () => {
    let samd = new SmartAppDelegate();
    samd.page({name: "myPage", title: "my title"}, () => {
      samd.section();
    });
    expect(samd.metadataValue.preferences).toBeDefined();
    expect(samd.metadataValue.preferences.pageList).toBeDefined();
    expect(samd.metadataValue.preferences.pageList).toBeInstanceOf(Array);
    expect(samd.metadataValue.preferences.pageList.length).toBe(1);
    let page = samd.metadataValue.preferences.pageList[0];
    expect(page).toBeDefined();
    expect(page.name).toBeDefined();
    expect(page.name).toBe("myPage");
    expect(page.sections).toBeDefined();
    expect(page.sections).toBeInstanceOf(Array);
    expect(page.sections.length).toBe(1);
  });
});
