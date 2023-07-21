import { describe, expect, test } from "@jest/globals";
import { toInteger } from "./object-utils";

describe("object to integer", () => {
  test("convert '2' string to a number 2", () => {
    expect(toInteger("2")).toBe(2);
  });
  test("convert 3 number to a number 3", () => {
    expect(toInteger(3)).toBe(3);
  });
  test("convert '3.14' string to a number 3", () => {
    expect(toInteger("3.14")).toBe(3);
  });
  test("convert 3.14 number to an integer 3", () => {
    expect(toInteger(3.14)).toBe(3);
  });
  test("convert 'x' string to undefined", () => {
    expect(toInteger("x")).toBeUndefined();
  });
  test("convert object {id: 486} to undefined", () => {
    expect(toInteger({ id: 486 })).toBeUndefined();
  });
  test("convert null to undefined", () => {
    expect(toInteger(null)).toBeUndefined();
  });
  test("convert undefined to undefined", () => {
    let x: any;
    expect(toInteger(x)).toBeUndefined();
  });
});
