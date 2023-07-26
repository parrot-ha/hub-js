//import http from "http";
import axios, { AxiosRequestConfig } from "axios";

// common functions for SmartApps and Devices
export class EntityDelegate {
  private _commonSandboxMethods: string[] = ["httpGet"];

  get sandboxMethods() {
    return this._commonSandboxMethods;
  }

  httpGet(url: string, config?: AxiosRequestConfig): Promise<any> {
    return axios.get(url, config);
  }

}
