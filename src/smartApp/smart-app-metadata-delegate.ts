import {
  createStandardPage,
  createStandardInput,
} from "../entity/entity-preferences-helper";

export class SmartAppMetadataDelegate {
  private _includeDefinition: boolean;
  private _includePreferences: boolean;
  private _sandboxMethods: string[] = [
    "definition",
    "preferences",
    "section",
    "input",
    "page",
    "dynamicPage",
  ];
  metadataValue: any = {
    definition: {},
    preferences: {},
  };

  private temporarySection: any = null;
  private temporaryPage: any = null;
  private singlePreferencesPage: boolean = false;

  constructor(
    includeDefinition: boolean = true,
    includePreferences: boolean = false
  ) {
    this._includeDefinition = includeDefinition;
    this._includePreferences = includePreferences;
  }

  get sandboxMethods() {
    return this._sandboxMethods;
  }

  public section(params: any, closure: Function) {
    this.createTemporarySection();
    if (params) {
      for (const key in params) {
        this.temporarySection[key] = params[key];
      }
    }

    if (closure != null) {
      closure();
    }
    this.addTemporarySection();
  }

  public input(params: any) {
    this.createTemporarySection();
    let tempInput: any = createStandardInput(params);
    this.temporarySection.input.push(tempInput);
    this.temporarySection.body.push(tempInput);
  }

  public preferences(closure: Function) {
    if (this._includePreferences) {
      this.metadataValue.preferences = {};
      closure();
      this.addTemporarySection();
      if (this.singlePreferencesPage) {
        this.section({}, () => {
          //TODO: create new section with default values (app name and modes)
        });
      }
      this.addTemporaryPage();
    }
  }

  public definition(definitionInfo: any) {
    if (this._includeDefinition) {
      this.metadataValue.definition = definitionInfo;
    }
  }

  public dynamicPage(params: any, closure: Function) {
    this.temporaryPage = createStandardPage();

    for (let key of Object.keys(params)) {
      this.temporaryPage[key] = params[key];
    }

    if (closure != null) {
      closure();
    }

    let newDynamicPage: any = JSON.parse(JSON.stringify(this.temporaryPage));

    this.temporaryPage = null;
    return newDynamicPage;
  }

  public page(params: any, closure: Function): void {
    this.temporaryPage = createStandardPage();
    for (let key of Object.keys(params)) {
      this.temporaryPage[key] = params[key];
    }

    if (closure != null) {
      closure();
    }

    this.addTemporaryPage();
  }

  private createTemporarySection() {
    if (!this.temporarySection) {
      if (!this.temporaryPage) {
        this.singlePreferencesPage = true;
        this.temporaryPage = createStandardPage();
      }
      this.temporarySection = {
        input: [],
        body: [],
        hideable: false,
        hidden: false,
      };
    }
  }

  private addTemporarySection() {
    if (this.temporarySection) {
      this.temporaryPage.sections.push(this.temporarySection);

      this.temporarySection = null;
    }
  }

  private addTemporaryPage() {
    if (this.temporaryPage) {
      if (!this.metadataValue.preferences.pageList) {
        this.metadataValue.preferences.pageList = [];
      }

      this.metadataValue.preferences.pageList.push(this.temporaryPage);

      this.temporaryPage = null;
    }
  }
}
