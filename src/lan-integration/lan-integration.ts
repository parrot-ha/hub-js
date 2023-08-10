import express, { Application, Request, Response } from "express";
import { Server } from "http";
import arp from "@network-utils/arp-lookup";
import { DeviceIntegration } from "../integration/device-integration";
import { LanDeviceMessageEvent } from "../integration/integration-events";
import { PreferencesBuilder } from "../integration/preferences-builder";
import { Protocol } from "../device/models/protocol";
import { HubAction } from "../device/models/hub-action";
import { HubResponse } from "../device/models/hub-response";
import http from "http";
const logger = require("../hub/logger-service")({ source: "LanIntegration" });

export default class LanIntegration extends DeviceIntegration {
  private _server: Server;
  private _serverPort: number;

  public start(): Promise<any> {
    return new Promise<any>((resolve) => {
      logger.info("Starting LAN integration");
      this._serverPort = this.getSettingAsInteger("serverPort", 39500);

      const app: Application = express();
      app.use(
        express.text({
          type(req) {
            return true;
          },
        })
      );

      this._server = app.listen(this._serverPort, () => {
        logger.info(`listening on ${this._serverPort}`);
      });
      app.all("/*", (req: Request, res: Response) => {
        let headersStr = `${req.method} ${req.originalUrl} ${req.httpVersion}\n`;

        for (let x = 0; x + 1 <= req.rawHeaders.length; x += 2) {
          headersStr = headersStr.concat(
            `${req.rawHeaders[x]}: ${req.rawHeaders[x + 1]}\n`
          );
        }

        let remoteAddress = req.ip;
        if (remoteAddress?.startsWith("::ffff:")) {
          remoteAddress = remoteAddress.substring(7);
        }

        let reqBody = "";
        if (typeof req.body === "string") {
          reqBody = req.body;
        }

        arp.toMAC(remoteAddress).then((macAddress: string) => {
          if (macAddress) {
            macAddress = macAddress.replaceAll(":", "").trim().toUpperCase();
          }
          this.processLanMessage(
            macAddress || "",
            req.socket.remoteAddress,
            req.socket.remotePort,
            reqBody,
            headersStr
          );
        });

        res.status(202).end();
      });
      resolve(true);
    });
  }

  public stop(): Promise<any> {
    return new Promise((resolve) => this._server.close(() => resolve(true)));
  }

  public removeIntegrationDeviceAsync(
    deviceNetworkId: string,
    force: boolean
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => resolve(true));
  }

  public processAction(action: HubAction): HubResponse {
    if (action === null || action === undefined) {
      return null;
    }
    if (action.action?.startsWith("lan discovery")) {
      // TODO: send out lan discovery message
      return null;
    } else {
      // send message out
      let hubResponse: HubResponse = new HubResponse();
      //TODO: check for options.get("protocol") : LAN_PROTOCOL_TCP, LAN_PROTOCOL_UDP
      // also: options.get("type") : LAN_TYPE_UDPCLIENT
      // https://community.smartthings.com/t/udp-not-possible-they-said-wait-whats-this/13466
      if (action.protocol === Protocol.LAN) {
        this.sendLanHubAction(action);
      } else {
        logger.warn(
          `Not implemented yet, Protocol: ${action.protocol} action: ${action.action}`
        );
      }
      return hubResponse;
    }
  }

  private sendLanHubAction(hubAction: HubAction): void {
    let path = hubAction.params?.path || "/";
    let method = hubAction.params?.method || "POST";
    //let protocol = hubAction.params?.protocol || Protocol.LAN;
    let headers: any = {
      Accept: "*/*",
      "User-Agent": "Linux UPnP/1.0 ParrotHub",
    };
    if (typeof hubAction.params?.body === "object") {
      headers["Content-Type"] = "application/json";
    } else {
      headers["Content-Type"] = 'text/xml; charset="utf-8"';
    }
    if (typeof hubAction.params?.headers === "object") {
      for (let key in hubAction.params?.headers) {
        headers[key] = hubAction.params?.headers[key];
      }
    }
    let query = hubAction.params?.query;
    let body: string;
    if (typeof hubAction.params?.body === "object") {
      body = JSON.stringify(hubAction.params?.body);
      headers["Content-Length"] = Buffer.byteLength(body);
    } else if (hubAction.params?.body) {
      body = hubAction.params?.body.toString();
      headers["Content-Length"] = Buffer.byteLength(body);
    }

    let hostHeaderValue = "";
    for (let headerKey of Object.keys(headers)) {
      if (headerKey.trim().toLowerCase() === "host") {
        hostHeaderValue = headers[headerKey];
      }
    }

    const myUrl = new URL(`http://${hostHeaderValue}`);
    if (path?.indexOf("?") > -1) {
      myUrl.pathname = path.substring(0, path.indexOf("?"));
      myUrl.search = path.substring(path.indexOf("?"));
    } else {
      myUrl.pathname = path;
    }
    if (query && typeof query === "object") {
      for (let queryParam of Object.keys(query)) {
        myUrl.searchParams.append(queryParam, query[queryParam]);
      }
    }

    let hubResponse = new HubResponse();
    let options = { method: method, headers: headers };
    const req = http.request(myUrl.toString(), options, (res) => {
      hubResponse.status = res.statusCode;
      hubResponse.headers = JSON.parse(JSON.stringify(res.headers));
      let httpVersion = res.httpVersion;
      let headers = res.headers;
      res.setEncoding("utf8");
      let rawData = "";
      res.on("data", (chunk: any) => {
        rawData += chunk;
      });

      res.on("end", () => {
        if (hubAction.callback != null) {
          hubResponse.body = rawData;
          hubResponse.callback = hubAction.callback;
          //TODO: notify of integration message;
        } else {
          // send message to device
          let headersStr = `${method} ${myUrl.pathname}${myUrl.search} ${httpVersion}\n`;

          for (let headerKey of Object.keys(headers)) {
            headersStr = headersStr.concat(
              `${headerKey}: ${headers[headerKey]}\n`
            );
          }

          arp.toMAC(myUrl.hostname).then((macAddress: string) => {
            if (macAddress) {
              macAddress = macAddress.replaceAll(":", "").trim().toUpperCase();
            }
            this.processLanMessage(
              macAddress || "",
              myUrl.hostname,
              parseInt(myUrl.port || "80"),
              rawData,
              headersStr
            );
          });
        }
      });
    });

    req.on("error", (e) => {
      logger.error(`problem with request: ${e.message}`);
    });

    // Write data to request body
    if (body) req.write(body);
    req.end();
  }

  public get name(): string {
    return "LAN";
  }

  public getProtocol(): Protocol {
    return Protocol.LAN;
  }

  public get description(): string {
    return "Allows integration of LAN based devices.";
  }

  public get displayInformation(): any {
    let model: any = {};
    if (this._server != null) {
      model["Port"] = this._serverPort?.toString() || "Not Set";
      model["Status"] = this._server.listening ? "RUNNING" : "STOPPED";
    } else {
      model.put("Status", "STOPPED");
    }
    return model;
  }

  public getPreferencesLayout(): any {
    return new PreferencesBuilder()
      .withTextInput(
        "serverPort",
        "Server TCP Port",
        "TCP port for server to listen on.",
        true,
        true
      )
      .build();
  }

  public settingValueChanged(keys: string[]): void {
    if (logger.isDebugEnabled()) {
      logger.debug("values changed " + keys);
    }
    if (keys?.indexOf("serverPort") > -1) {
      // restart the integration
      this.stop();
      this.start();
    }
  }

  private processLanMessage(
    macAddress: string,
    remoteAddress: string,
    remotePort: number,
    body: string,
    headers: string
  ): void {
    let base64Headers: string = btoa(headers);
    let base64Body: string = "";
    if (body != null) {
      base64Body = btoa(body);
    }

    let deviceDescription: string =
      "mac: " +
      macAddress +
      ", headers: " +
      base64Headers +
      ", body: " +
      base64Body;

    if (logger.isDebugEnabled()) {
      logger.debug("Message received: " + deviceDescription);
    }

    this.sendEvent(
      new LanDeviceMessageEvent(
        macAddress,
        remoteAddress,
        remotePort,
        deviceDescription
      )
    );
  }
}
