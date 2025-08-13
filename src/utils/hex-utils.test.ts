import { describe, expect, test, it } from "@jest/globals";
import {
  numberArrayToHexString,
  hexStringToNumberArray,
  hexStringToInt,
  reverseHexString,
  numberToHexString
} from "./hex-utils";

describe("hex string to number array", () => {
  test("convert 8 byte hex string to a number array", () => {
    let numberArray = hexStringToNumberArray("0693427d9e335204");
    expect(numberArray).toBeDefined();
    expect(numberArray.length).toBe(8);
    expect(numberArray[0]).toBe(6);
    expect(numberArray[4]).toBe(158);
    expect(numberArray[7]).toBe(4);
  });
  it("should convert 0x-prefixed hex string", () => {
    expect(hexStringToNumberArray("0x01ff10")).toEqual([1, 255, 16]);
  });
  it("should pad odd-length hex strings", () => {
    expect(hexStringToNumberArray("abc")).toEqual([10, 188]);
  });
  it("should remove whitespace", () => {
    expect(hexStringToNumberArray("0 1 f f 1 0")).toEqual([1, 255, 16]);
  });
  it("should throw if input is null", () => {
    expect(() => hexStringToNumberArray(null as any)).toThrow();
  });

describe("number to hex string", () => {
  test("convert 0 to 1 byte hex string", () => {
    let str = numberToHexString(0, 1);
    expect(str).toBeDefined();
    expect(str).toBe("00");
  });
  it("should convert number to hex string with minBytes", () => {
    expect(numberToHexString(255, 2)).toBe("00ff");
    expect(numberToHexString(1, 1)).toBe("01");
    expect(numberToHexString(0, 2)).toBe("0000");
  });
  it("should throw if value or minBytes is null/undefined", () => {
    expect(() => numberToHexString(null as any, 1)).toThrow();
    expect(() => numberToHexString(1, null as any)).toThrow();
  });
  it("should throw if minBytes <= 0", () => {
    expect(() => numberToHexString(1, 0)).toThrow();
    expect(() => numberToHexString(1, -1)).toThrow();
  });
});

describe("numberArrayToHexString", () => {
  it("should convert number array to hex string", () => {
    expect(numberArrayToHexString([1, 255, 16])).toBe("01ff10");
    expect(numberArrayToHexString([0, 0, 0])).toBe("000000");
  });
  it("should throw if input is undefined", () => {
    expect(() => numberArrayToHexString(undefined as any)).toThrow();
  });
});

describe("hexStringToInt", () => {
  it("should convert hex string to int", () => {
    expect(hexStringToInt("0x10")).toBe(16);
    expect(hexStringToInt("ff")).toBe(255);
    expect(hexStringToInt("0abc")).toBe(2748);
  });
  it("should throw if input is null", () => {
    expect(() => hexStringToInt(null as any)).toThrow();
  });
});

describe("reverseHexString", () => {
  it("should reverse hex string by bytes", () => {
    expect(reverseHexString("0a1b2c")).toBe("2c1b0a");
    expect(reverseHexString("abcd")).toBe("cdab");
  });
  it("should return null if input is null", () => {
    expect(reverseHexString(null as any)).toBeNull();
  });
  it("should return input if length < 3", () => {
    expect(reverseHexString("a")).toBe("a");
    expect(reverseHexString("ab")).toBe("ab");
  });
  it("should throw if input is odd length", () => {
    expect(() => reverseHexString("abc")).toThrow();
  });
});
});
