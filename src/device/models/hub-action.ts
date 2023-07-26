import { Protocol } from "./protocol";

export class HubAction {
  private _action: string;
  private _dni: string;
  private _responseType: string; //used for z-wave to specify the command class and command response type
  private _protocol: Protocol;
  private _options: any;

  constructor(
    action: string,
    protocol: Protocol = Protocol.OTHER,
    options: any = {},
    dni: string = null,
    responseType: string = null
  ) {
    this._action = action;
    this._protocol = protocol;
    this._options = options;
    this._dni = dni;
    this._responseType = responseType;
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

  public toString() {
    return this._action;
  }
}
