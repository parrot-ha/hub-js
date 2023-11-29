export class HubResponse {
  private _index: string;
  private _port: string;
  private _ip: string;
  private _requestId: string;
  private _hubId: string;
  private _status: number;
  private _body: string;
  private _headers: any;
  private _callback: string;

  public get index(): string {
    return this._index;
  }
  public set index(value: string) {
    this._index = value;
  }
  public get port(): string {
    return this._port;
  }
  public set port(value: string) {
    this._port = value;
  }
  public get ip(): string {
    return this._ip;
  }
  public set ip(value: string) {
    this._ip = value;
  }
  public get requestId(): string {
    return this._requestId;
  }
  public set requestId(value: string) {
    this._requestId = value;
  }
  public get hubId(): string {
    return this._hubId;
  }
  public set hubId(value: string) {
    this._hubId = value;
  }
  public get status(): number {
    return this._status;
  }
  public set status(value: number) {
    this._status = value;
  }
  public get body(): string {
    return this._body;
  }
  public set body(value: string) {
    this._body = value;
  }
  public get headers(): any {
    return this._headers;
  }
  public set headers(value: any) {
    this._headers = value;
  }
  public get callback(): string {
    return this._callback;
  }
  public set callback(value: string) {
    this._callback = value;
  }
}
