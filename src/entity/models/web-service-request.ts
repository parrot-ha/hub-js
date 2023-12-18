export class WebServiceRequest {
  private _body: string;
  private _method: string;
  private _JSON: any;
  private _headers: any;

  constructor(method: string, headers: any, body: string) {
    this._method = method;
    this._body = body;
    this._headers = headers;
  }

  public get body(): string {
    return this._body;
  }

  public get method(): string {
    return this._method;
  }

  public get headers(): any {
    return this._headers;
  }
}
