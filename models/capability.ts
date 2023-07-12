import { Attribute } from "./attribute";
import { Command } from "./command";

export class Capability {
    name: string;
    reference: string;
    attributes: Attribute[];
    commands: Command[];

    constructor(name: string, reference: string, attributes: Attribute[], commands: Command[]) {
        this.name = name;
        this.reference = reference;
        this.attributes = attributes;
        this.commands = commands;
    }
}