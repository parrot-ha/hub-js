import { randomUUID } from "crypto";

export class OAuthToken {
  accessToken: string;
  refreshToken: string;
  type: string;
  expiration: number;

  //TODO: ST returns an expires_in ~50 years in the future, should we shorten it?
  constructor(
    type = "bearer",
    accessToken = randomUUID(),
    refreshToken = randomUUID(),
    expiration = 60 * 60 * 24 * 365 * 49
  ) {
    this.type = type;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiration = expiration;
  }

  public static buildFromObject(obj: any): OAuthToken {
    let oAuthToken = new OAuthToken();
    oAuthToken.accessToken = obj.accessToken;
    oAuthToken.refreshToken = obj.refreshToken;
    oAuthToken.type = obj.type;
    oAuthToken.expiration = obj.expiration;

    return oAuthToken;
  }
}
