import { describe, expect, test } from "@jest/globals";

import { parseLanMessage } from "./device-helper";
describe("test parse lan message", () => {
  test("parse lan message with path param and no body", () => {
    let responseMap = parseLanMessage(
      "mac: , headers: R0VUIC9vdXRwdXQvb2ZmIDEuMQpIb3N0OiAxOTIuMTY4LjEuMTY6Mzk1MDAKQ29udGVudC1MZW5ndGg6IDAKVXNlci1BZ2VudDogU2hlbGx5LzIwMjMwOTEzLTExMjAwMy92MS4xNC4wLWdjYjg0NjIzIChTSFNXLTEpCg==, body: ",
    );

    let keys = Object.keys(responseMap.headers);
    expect(keys).toBeDefined();
    expect(keys.length).toBe(4);
    let getString = keys.find((key) => key.startsWith("GET"));

    expect(getString).toBeDefined();
    expect(getString).toBe("GET /output/off 1.1");

    let host = responseMap.headers.Host;
    expect(host).toBeDefined();
    expect(host).toBe("192.168.1.16:39500");

    let contentLength = responseMap.headers["Content-Length"];
    expect(contentLength).toBeDefined();
    expect(contentLength).toBe("0");

    let userAgent = responseMap.headers["User-Agent"];
    expect(userAgent).toBeDefined();
    expect(userAgent).toBe("Shelly/20230913-112003/v1.14.0-gcb84623 (SHSW-1)")
  });
});
