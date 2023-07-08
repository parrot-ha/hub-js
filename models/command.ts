import { CommandArgument } from "./command-argument";

export class Command {
  name: string;
  arguments: CommandArgument[] | undefined;

  constructor(name: string) {
    this.name = name;
  }
}
