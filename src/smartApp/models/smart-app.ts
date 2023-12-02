import { OAuthToken } from "./oauth-token";

export enum SmartAppType {
  USER,
  SYSTEM,
  EXTENSION,
}

export class SmartApp {
  id: string | undefined;
  file: string | undefined;
  name: string | undefined;
  namespace: string | undefined;
  author: string | undefined;
  description: string | undefined;
  category: string | undefined;
  installOnOpen: boolean = false;
  documentationLink: string | undefined;
  iconUrl: string | undefined;
  iconX2Url: string | undefined;
  iconX3Url: string | undefined;
  parent: string | undefined;

  oAuthClientId: string | undefined;
  oAuthClientSecret: string | undefined;
  oAuthRedirectURI: string | undefined;
  oAuthDisplayName: string | undefined;
  oAuthDisplayLink: string | undefined;
  oAuthTokens: OAuthToken[];

  extensionId: string;
  type: SmartAppType;

  public get oAuthEnabled(): boolean {
    return (
      this.oAuthClientId?.replace(/\s/g, "")?.length > 0 &&
      this.oAuthClientSecret?.replace(/\s/g, "")?.length > 0
    );
  }

  public static buildFromObject(obj: any) {
    let sa = new SmartApp();
    sa.id = obj.id;
    sa.file = obj.file;
    sa.name = obj.name;
    sa.namespace = obj.namespace;
    sa.author = obj.author;
    sa.description = obj.description;
    sa.category = obj.category;
    sa.installOnOpen = obj.installOnOpen;
    sa.documentationLink = obj.documentationLink;
    sa.iconUrl = obj.iconUrl;
    sa.iconX2Url = obj.iconX2Url;
    sa.iconX3Url = obj.iconX3Url;
    sa.parent = obj.parent;

    sa.oAuthClientId = obj.oAuthClientId;
    sa.oAuthClientSecret = obj.oAuthClientSecret;
    sa.oAuthRedirectURI = obj.oAuthRedirectURI;
    sa.oAuthDisplayName = obj.oAuthDisplayName;
    sa.oAuthDisplayLink = obj.oAuthDisplayLink;

    sa.oAuthTokens = [];
    if (
      obj.oAuthTokens != null &&
      Array.isArray(obj.oAuthTokens) &&
      obj.oAuthTokens.length > 0
    ) {
      for (let oAuthToken of obj.oAuthTokens) {
        sa.oAuthTokens.push(OAuthToken.buildFromObject(oAuthToken));
      }
    }
    sa.extensionId = obj.extensionId;

    sa.type = obj.type as SmartAppType;

    return sa;
  }

  public equalsIgnoreId(
    sa: SmartApp,
    includeOAuthClientIdSecret: boolean = false
  ): boolean {
    if (sa == null) {
      return false;
    }
    if (sa === this) {
      return true;
    }
    if (this.file !== sa.file) {
      return false;
    }
    if (this.name !== sa.name) {
      return false;
    }
    if (this.namespace !== sa.namespace) {
      return false;
    }
    if (this.author !== sa.author) {
      return false;
    }
    if (this.description !== sa.description) {
      return false;
    }
    if (this.category !== sa.category) {
      return false;
    }
    if (this.installOnOpen !== sa.installOnOpen) {
      return false;
    }
    if (this.documentationLink !== sa.documentationLink) {
      return false;
    }
    if (this.iconUrl !== sa.iconUrl) {
      return false;
    }
    if (this.iconX2Url !== sa.iconX2Url) {
      return false;
    }
    if (this.iconX3Url !== sa.iconX3Url) {
      return false;
    }
    if (this.parent !== sa.parent) {
      return false;
    }
    if (this.oAuthDisplayName !== sa.oAuthDisplayName) {
      return false;
    }
    if (this.oAuthDisplayLink !== sa.oAuthDisplayLink) {
      return false;
    }
    if (includeOAuthClientIdSecret) {
      if (this.oAuthClientId !== sa.oAuthClientId) {
        return false;
      }
      if (this.oAuthClientSecret !== sa.oAuthClientSecret) {
        return false;
      }
    }
    if (this.extensionId !== sa.extensionId) {
      return false;
    }
    return this.type === sa.type;
  }
}
