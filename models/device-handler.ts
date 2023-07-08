import { Command } from "./command";

export class DeviceHandler {
  id: string | undefined;
  file: string | undefined;
  name: string | undefined;
  namespace: string | undefined;
  author: string | undefined;
  tags: string[] | undefined;
  capabilityList: string[] | undefined;
  commandList: Command[] | undefined;

  getCommands() {
    //TODO: handle capabilites in a capabilities service or util
    let retCommandList: Command[] = [];
    if (this.commandList) {
      retCommandList.concat(this.commandList);
    }
    if (this.capabilityList) {
      this.capabilityList.forEach((capability) => {
        if (capability == "Switch") {
          retCommandList.push(new Command("on"));
          retCommandList.push(new Command("off"));
        }
      });
    }
  }
}
