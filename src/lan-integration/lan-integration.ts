import express, { Application, Request, Response } from "express";
import { Server } from "http";
import arp from "@network-utils/arp-lookup";
import { DeviceIntegration } from "../integration/device-integration";
import { LanDeviceMessageEvent } from "../integration/integration-events";
import { PreferencesBuilder } from "../utils/preferences-builder";
import { Protocol } from "../device/models/protocol";
import { HubAction } from "../device/models/hub-action";
const logger = require("../hub/logger-service")({ source: "LanIntegration" });

export class LanIntegration extends DeviceIntegration {
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
            macAddress = macAddress.replace(":", "").trim().toUpperCase();
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

  public processAction(action: HubAction): string {
    throw new Error("Method not implemented.");
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
