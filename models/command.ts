import { CommandArgument } from "./command-argument";

export class Command {
  name: string;
  arguments: CommandArgument[];

  constructor(name: string, cmdArguments: CommandArgument[] = null) {
    this.name = name;
    this.arguments = cmdArguments;
  }
}
