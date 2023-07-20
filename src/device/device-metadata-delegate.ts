import { CommandArgument } from "./models/command-argument";
import { Command } from "./models/command";

export class DeviceMetadataDelegate {
  private _includeDefinition: boolean;
  private _includePreferences: boolean;
  private _sandboxMethods: string[] = [
    "metadata",
    "definition",
    "preferences",
    "capability",
    "command",
    "input",
  ];
  metadataValue: any = {
    definition: {
      capabilities: [],
      attributes: [],
      commands: [],
      fingerprints: [],
    },
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

  public command(commandName: string, commandArguments: any[]) {
    if (!commandName) {
      return;
    }
    let cmd: Command;
    if (commandArguments) {
      let cmdArgs: CommandArgument[] = [];
      commandArguments.forEach((commandArgument) => {
        if (typeof commandArgument === "string") {
          cmdArgs.push(new CommandArgument(commandArgument, null, null));
        }
        //TODO: handle array
      });

      cmd = new Command(commandName, cmdArgs);
    } else {
      cmd = new Command(commandName, null);
    }
    this.metadataValue.definition.commands.push(cmd);
  }

  public capability(capabilityName: string) {
    this.metadataValue.definition.capabilities.push(capabilityName);
  }

  public preferences(closure: Function) {
    if (this._includePreferences) {
      this.metadataValue.preferences = {};
      closure();
      this.addTemporarySection();
    }
  }

  public definition(definitionInfo: any, closure: Function) {
    if (this._includeDefinition) {
      this.metadataValue.definition = definitionInfo;
      this.metadataValue.definition.capabilities = [];
      this.metadataValue.definition.attributes = [];
      this.metadataValue.definition.commands = [];
      this.metadataValue.definition.fingerprints = [];
      closure();
    }
  }

  public metadata(closure: Function) {
    closure();
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
