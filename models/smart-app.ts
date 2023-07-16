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
  //oAuthTokens: OAuthToken[]

  extensionId: string;
  type: SmartAppType;

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
