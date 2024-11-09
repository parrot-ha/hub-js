import http, { IncomingMessage } from "http";
import https from "https";
import { ServiceFactory } from "../hub/service-factory";
import { isBlank, isEmpty, stringToObject } from "../utils/string-utils";
import { ScheduleService } from "../hub/schedule-service";
import { timeOffset as timeUtilsOffset } from "../utils/time-utils";

// common functions for SmartApps and Devices
export abstract class EntityDelegate {
  private _commonSandboxMethods: string[] = [
    "httpGet",
    "httpPost",
    "runIn",
    "schedule",
    "runEvery1Minute",
    "runEvery5Minutes",
    "runEvery10Minutes",
    "runEvery15Minutes",
    "runEvery30Minutes",
    "runEvery1Hour",
    "runEvery3Hours",
    "unschedule",
    "parseLanMessage",
    "now",
    "toDateTime",
    "timeOffset",
  ];

  get sandboxMethods() {
    return this._commonSandboxMethods;
  }

  abstract get entityType(): string;
  abstract get entityId(): string;

  private _scheduleService: ScheduleService;

  constructor(scheduleService: ScheduleService) {
    this._scheduleService = scheduleService;
  }

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

  //TODO: add handling of (string, string, callback) function
  httpPost(param1: any, param2: any, param3: Function): void {
    if (typeof param1 === "string" && typeof param2 === "string") {
      //TODO: implement body
      this.httpRequest("POST", false, param1, {}, param3);
    } else if (
      typeof param1 === "object" &&
      typeof param2 === "function" &&
      param3 == null
    ) {
      if (param1.uri?.startsWith("http://")) {
        this.httpRequest("POST", false, param1.uri, param1, param2);
      } else if (param1.uri?.startsWith("https://")) {
        this.httpRequest("POST", true, param1.uri, param1, param2);
      } else {
        this.httpRequest("POST", false, null, param1, param2);
      }
    }
  }

  private httpRequest(
    method: string,
    secure: boolean,
    url: string,
    options: any,
    callback: Function,
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
          try {
            callback(e, null);
          } catch (err) {
            console.log(
              "Uncaught exception from httpRequest callback",
              err.message,
            );
          }
          return;
        }
        try {
          callback(null, responseDecorator);
        } catch (err) {
          console.log(
            "Uncaught exception from httpRequest callback",
            err.message,
          );
        }
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
    options: any = {},
  ): void {
    this._scheduleService.runIn(
      delayInSeconds,
      this.entityType,
      this.entityId,
      typeof handlerMethod === "function" ? handlerMethod.name : handlerMethod,
      options,
    );
  }

  public schedule(
    schedule: string | Date,
    handlerMethod: string | Function,
    options: any = {},
  ): void {
    this._scheduleService.scheduleEvery(
      schedule,
      this.entityType,
      this.entityId,
      typeof handlerMethod === "function" ? handlerMethod.name : handlerMethod,
      options,
    );
  }

  public runEvery1Minute(handlerMethod: string | Function): void {
    this.scheduleEveryTimeOfMinutes(1, handlerMethod);
  }
  public runEvery5Minutes(handlerMethod: string | Function): void {
    this.scheduleEveryTimeOfMinutes(5, handlerMethod);
  }
  public runEvery10Minutes(handlerMethod: string | Function): void {
    this.scheduleEveryTimeOfMinutes(10, handlerMethod);
  }

  public runEvery15Minutes(handlerMethod: string | Function): void {
    this.scheduleEveryTimeOfMinutes(15, handlerMethod);
  }

  public runEvery30Minutes(handlerMethod: string | Function): void {
    this.scheduleEveryTimeOfMinutes(30, handlerMethod);
  }
  public runEvery1Hour(handlerMethod: string | Function): void {
    this.scheduleEveryTimeOfHours(1, handlerMethod);
  }
  public runEvery3Hours(handlerMethod: string | Function): void {
    this.scheduleEveryTimeOfHours(3, handlerMethod);
  }

  private scheduleEveryTimeOfMinutes(
    minutesParam: number,
    handlerMethod: string | Function,
  ): void {
    // create a cron schedule that starts randomly in the next minutes
    let seconds = this.getRandomInt(60);
    // pick a random time to start

    let minutes = new Date().getMinutes() + this.getRandomInt(minutesParam);
    if (minutes > 59) {
      minutes = minutes - 60;
    }
    let cronExpression = `${seconds} ${minutes}/${minutesParam} * * * ?`;
    this.schedule(cronExpression, handlerMethod, null);
  }

  private scheduleEveryTimeOfHours(
    hourParam: number,
    handlerMethod: string | Function,
  ): void {
    // create a cron schedule that starts randomly in the next minutes
    let seconds = this.getRandomInt(60);
    // pick a random time to start
    let minutes = new Date().getMinutes() + this.getRandomInt(60);
    if (minutes > 59) {
      minutes = minutes - 60;
    }
    let cronExpression = `${seconds} ${minutes} */${hourParam} * * * ?`;
    this.schedule(cronExpression, handlerMethod, null);
  }

  private getRandomInt(max: number): number {
    return Math.floor(Math.random() * max);
  }

  public unschedule(handlerMethod: string | Function) {
    this._scheduleService.unschedule(
      this.entityType,
      this.entityId,
      typeof handlerMethod === "function" ? handlerMethod.name : handlerMethod,
    );
  }

  public now(): number {
    return new Date().getTime();
  }

  public toDateTime(dateTimeString: string): Date {
    return new Date(dateTimeString);
  }

  public timeOffset(offset: string | number): number {
    return timeUtilsOffset(offset);
  }
}
