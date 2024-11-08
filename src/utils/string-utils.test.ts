import { describe, expect, test } from "@jest/globals";
import { stringToObject } from "./string-utils";

describe("string to object", () => {
  const testCases = [
    {
      input: "key1=value1;key2=value2",
      entrySep: ";",
      kvSep: "=",
      expected: { key1: "value1", key2: "value2" },
    },
    {
      input: "key1=;key2=value2",
      entrySep: ";",
      kvSep: "=",
      expected: { key1: null, key2: "value2" },
    },
    {
      input: "key1;key2=value2",
      entrySep: ";",
      kvSep: "=",
      expected: { key1: null, key2: "value2" },
    },
    {
      input: "",
      entrySep: ";",
      kvSep: "=",
      expected: {},
    },
    {
      input: "key1:value1,key2:value2",
      entrySep: ",",
      kvSep: ":",
      expected: { key1: "value1", key2: "value2" },
    },
  ];

  test("run string to object test cases", () => {
    for (const testCase of testCases) {
      const result = stringToObject(
        testCase.input,
        testCase.entrySep,
        testCase.kvSep,
      );
      // Compare result with expected
      expect(JSON.stringify(result)).toBe(JSON.stringify(testCase.expected));
    }
  });
});
