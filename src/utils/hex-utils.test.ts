import { describe, expect, test } from "@jest/globals";
import { hexStringToNumberArray, numberToHexString } from "./hex-utils";

describe("hex string to number array", () => {
  test("convert 8 byte hex string to a number array", () => {
    let numberArray = hexStringToNumberArray("0693427d9e335204");
    expect(numberArray).toBeDefined();
    expect(numberArray.length).toBe(8);
    expect(numberArray[0]).toBe(6);
    expect(numberArray[4]).toBe(158);
    expect(numberArray[7]).toBe(4);
  });
});

describe("number to hex string", () => {
  test("convert 0 to 1 byte hex string", () => {
    let str = numberToHexString(0, 1);
    expect(str).toBeDefined();
    expect(str).toBe("00");
  });
});
