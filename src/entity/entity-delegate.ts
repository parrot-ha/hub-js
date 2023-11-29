import http, { IncomingMessage } from "http";
import https from "https";
import { ServiceFactory } from "../hub/service-factory";
import { isBlank, isEmpty, stringToObject } from "../utils/string-utils";

// common functions for SmartApps and Devices
export abstract class EntityDelegate {
  private _commonSandboxMethods: string[] = [
    "httpGet",
    "runIn",
    "schedule",
    "parseLanMessage",
  ];

  get sandboxMethods() {
    return this._commonSandboxMethods;
  }

  abstract get entityType(): string;
  abstract get entityId(): string;

  parseLanMessage(stringToParse: string): any {
    if (stringToParse == null) {
      return null;
    }
    if (isBlank(stringToParse)) {
      return {};
    }
    let lanMessageMap: any = {};

    let lanMessageInterim = stringToObject(stringToParse, ",", ":");

    for (let key of Object.keys(lanMessageInterim)) {
      if (isEmpty(lanMessageInterim[key])) {
        lanMessageMap[key] = null;
      } else if ("headers" === key) {
        // base 64 decode the headers
        let header = atob(lanMessageInterim[key]);
        lanMessageMap["header"] = header;

        // TODO: is there a library we can use to do this?
        let headerMap = stringToObject(header, "\n", ":");
        lanMessageMap["headers"] = headerMap;
      } else if ("body" === key) {
        // base 64 decode the message
        lanMessageMap["body"] = atob(lanMessageInterim[key]);
      } else {
        lanMessageMap[key] = lanMessageInterim[key];
      }
    }
    return lanMessageMap;
  }

  httpGet(param: any, callback: Function): void {
    console.log("call to httpGet", JSON.stringify(param));
    if (typeof param === "string") {
      let url = param.trim();
      if (url.startsWith("http://")) {
        // http request
        this.httpRequest("GET", false, url, {}, callback);
      } else if (url.startsWith("https://")) {
        // https request
        this.httpRequest("GET", true, url, {}, callback);
      }
    } else if (typeof param === "object") {
      //TODO: figure out if secure
      this.httpRequest("GET", false, null, param, callback);
    }
  }

  private httpRequest(
    method: string,
    secure: boolean,
    url: string,
    options: any,
    callback: Function
  ) {
    function httpCallback(res: IncomingMessage) {
      const { statusCode } = res;
      const contentType: string = res.headers["content-type"];

      // let error;
      let responseDecorator: any = {};
      responseDecorator.status = statusCode;

      res.setEncoding("utf8");
      let rawData = "";
      res.on("data", (chunk: any) => {
        rawData += chunk;
      });
      res.on("end", () => {
        try {
          if (contentType.includes("json")) {
            responseDecorator.data = JSON.parse(rawData);
          } else {
            responseDecorator.data = rawData;
          }
        } catch (e) {
          console.error(e.message);
          callback(e, null);
          return;
        }
        callback(null, responseDecorator);
      });
    }

    let req;
    if (!options) {
      options = { method: method };
    } else {
      options.method = method;
    }
    if (url) {
      if (secure) {
        req = https.request(url, options, httpCallback);
      } else {
        req = http.request(url, options, httpCallback);
      }
    } else {
      if (secure) {
        req = https.request(options, httpCallback);
      } else {
        req = http.request(options, httpCallback);
      }
    }

    if (req) {
      req.on("error", (e: any) => {
        console.error(`Got error: ${e.message}`);
        callback(e, null);
      });
      req.end();
    } else {
      callback(new Error("request failed"), null);
    }
  }

  public runIn(
    delayInSeconds: number,
    handlerMethod: string | Function,
    options: any = {}
  ): void {
    ServiceFactory.getInstance()
      .getScheduleService()
      .runIn(
        delayInSeconds,
        this.entityType,
        this.entityId,
        typeof handlerMethod === "function"
          ? handlerMethod.name
          : handlerMethod,
        options
      );
  }

  public schedule(
    schedule: string | Date,
    handlerMethod: string | Function,
    options: any = {}
  ): void {
    ServiceFactory.getInstance()
      .getScheduleService()
      .scheduleEvery(
        schedule,
        this.entityType,
        this.entityId,
        typeof handlerMethod === "function"
          ? handlerMethod.name
          : handlerMethod,
        options
      );
  }
}
