export class SmartAppMetadataDelegate {
  private _includeDefinition: boolean;
  private _includePreferences: boolean;
  private _sandboxMethods: string[] = [
    "definition",
    "preferences",
    "section",
    "input",
  ];
  metadataValue: any = {
    definition: {},
    preferences: {},
  };

  private temporarySection: any = null;

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

  public section(title: string, closure: Function) {
    this.createTemporarySection();
    this.temporarySection.title = title;
    if (closure != null) {
      closure();
    }
    this.addTemporarySection();
  }

  public input(name: string, type: string, additionalOptions: any) {
    this.createTemporarySection();
    console.log("input name", name, "type", type, "ao", additionalOptions);
    let tempInput: any;
    if (additionalOptions) {
      tempInput = additionalOptions;
    } else {
      tempInput = {};
    }
    if (additionalOptions) {
      for (const key in additionalOptions) {
        tempInput[key] = additionalOptions[key];
      }
    }
    tempInput.name = name;
    tempInput.type = type;
    this.temporarySection.input.push(tempInput);
    this.temporarySection.body.push(tempInput);
  }

  public preferences(closure: Function) {
    if (this._includePreferences) {
      this.metadataValue.preferences = {};
      closure();
      this.addTemporarySection();
    }
  }

  public definition(definitionInfo: any) {
    if (this._includeDefinition) {
      this.metadataValue.definition = definitionInfo;
    }
  }

  private createTemporarySection() {
    if (!this.temporarySection) {
      this.temporarySection = {
        input: [],
        body: [],
      };
    }
  }

  private addTemporarySection() {
    if (this.temporarySection) {
      if (!this.metadataValue.preferences.sections) {
        this.metadataValue.preferences.sections = [];
      }
      this.metadataValue.preferences.sections.push(this.temporarySection);

      this.temporarySection = null;
    }
  }
}
