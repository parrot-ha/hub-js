import { CommandArgument } from "./models/command-argument";
import { Command } from "./models/command";
import { createStandardInput } from "../entity/entity-preferences-helper";
import { Fingerprint } from "./models/fingerprint";

export class DeviceMetadataDelegate {
  private _includeDefinition: boolean;
  private _includePreferences: boolean;
  private _sandboxMethods: string[] = [
    "metadata",
    "definition",
    "preferences",
    "section",
    "capability",
    "command",
    "input",
    "fingerprint",
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

  public fingerprint(value: any) {
    let fingerprints = this.metadataValue.definition.fingerprints;
    if (fingerprints == null) {
      fingerprints = [];
      this.metadataValue.definition.fingerprints = fingerprints;
    }
    fingerprints.push(Fingerprint.buildFromObject(value));
  }

  public section(title: string, closure: Function) {
    this.createTemporarySection();
    this.temporarySection.title = title;
    if (closure != null) {
      closure();
    }
    this.addTemporarySection();
  }

  public input(param1: any, param2: any, param3: any) {
    this.createTemporarySection();
    let tempInput: any;

    if (typeof param1 === "string" && typeof param2 === "string") {
      if (param3 && typeof param3 === "object") {
        param3.name = param1;
        param3.type = param2;
      } else {
        param3 = { name: param1, type: param2 };
      }
      tempInput = createStandardInput(param3);
    } else if (typeof param1 === "object") {
      tempInput = createStandardInput(param1);
    } else {
      tempInput = createStandardInput({});
    }
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
      if (closure) closure();
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
