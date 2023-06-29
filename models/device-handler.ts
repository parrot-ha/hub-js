import { Command } from "./command";

export class DeviceHandler {
    id: string;
    file: string;
    name: string;
    namespace: string;
    author: string;
    tags: string[];
    capabilityList: string[];
    commandList: Command[];
}