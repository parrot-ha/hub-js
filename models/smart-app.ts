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

    extensionId: string | undefined;
    //type: SmartAppType;
  }
  