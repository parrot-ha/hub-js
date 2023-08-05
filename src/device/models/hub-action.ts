import { Protocol } from "./protocol";

export class HubAction {
  private _action: string;
  private _dni: string;
  private _responseType: string; //used for z-wave to specify the command class and command response type
  private _protocol: Protocol = Protocol.LAN;
  private _options: any;

  private _params: any;

  // HubAction(Map params, String dni = null, [Map options])
  // HubAction(String action, Protocol protocol, String dni, Map options)
  // HubAction(String action, Protocol protocol)
  // HubAction(String action)
  constructor(
    param1: any,
    param2: any = null,
    param3: any = null,
    param4: any = null
  ) {
    if (typeof param1 === "string") {
      this._action = param1;
      if (param2) {
        this._protocol = param2;
      }
      if (typeof param3 === "string") {
        this._dni = param3;
      }
      if (typeof param4 === "object") {
        this._options = param4;
      }
    } else if (typeof param1 === "object") {
      this._params = param1;

      if (typeof param2 === "string") {
        this._dni = param2;
      }
      if (typeof param3 === "object") {
        this._options = param3;
      }
    }
  }

  public get callback(): string {
    let callbackObj: any = this._options?.callback;
    if (typeof callbackObj === "function") {
      return (callbackObj as Function).name;
    } else if (typeof callbackObj === "string") {
      return callbackObj;
    } else {
      return null;
    }
  }

  public get action(): string {
    return this._action;
  }
  public set action(value: string) {
    this._action = value;
  }
  public get dni(): string {
    return this._dni;
  }
  public set dni(value: string) {
    this._dni = value;
  }
  public get responseType(): string {
    return this._responseType;
  }
  public set responseType(value: string) {
    this._responseType = value;
  }
  public get protocol(): Protocol {
    return this._protocol;
  }
  public set protocol(value: Protocol) {
    this._protocol = value;
  }
  public get options(): any {
    return this._options;
  }
  public set options(value: any) {
    this._options = value;
  }

  public get params(): any {
    return this._params;
  }

  public toString() {
    return this._action;
  }
}
