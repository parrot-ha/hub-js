import { Attribute } from "./attribute";
import { Command } from "./command";
import { arraysEqual } from "../../utils/object-utils";
import { Fingerprint } from "./fingerprint";

export enum DeviceHandlerType {
  USER,
  SYSTEM,
  EXTENSION,
}

export class DeviceHandler {
  id: string | undefined;
  file: string | undefined;
  name: string | undefined;
  namespace: string | undefined;
  author: string | undefined;
  tags: string[] | undefined;
  capabilityList: string[] | undefined;
  commandList: Command[] | undefined;
  attributeList: Attribute[];
  fingerprints: Fingerprint[];
  extensionId: string;
  type: DeviceHandlerType;
  inlcudes: Array<string>;

  public static buildFromObject(obj: any) {
    let dh = new DeviceHandler();
    dh.id = obj.id;
    dh.file = obj.file;
    dh.name = obj.name;
    dh.namespace = obj.namespace;
    dh.author = obj.author;
    dh.tags = obj.tags;
    dh.capabilityList = obj.capabilityList;
    dh.commandList = obj.commandList;
    dh.attributeList = obj.attributeList;
    dh.fingerprints = [];
    if (
      obj.fingerprints != null &&
      Array.isArray(obj.fingerprints) &&
      obj.fingerprints.length > 0
    ) {
      for (let fingerprint of obj.fingerprints) {
        dh.fingerprints.push(Fingerprint.buildFromObject(fingerprint));
      }
    }
    dh.extensionId = obj.intg;
    dh.type = obj.type as DeviceHandlerType;
    dh.inlcudes = obj.includes;

    return dh;
  }

  public equalsIgnoreId(dh: DeviceHandler): boolean {
    if (dh == null) {
      return false;
    }
    if (dh === this) {
      return true;
    }
    if (this.file !== dh.file) {
      return false;
    }
    if (this.name !== dh.name) {
      return false;
    }
    if (this.namespace !== dh.namespace) {
      return false;
    }
    if (this.author !== dh.author) {
      return false;
    }
    if (!arraysEqual(this.tags, dh.tags)) {
      return false;
    }
    if (!arraysEqual(this.capabilityList, dh.capabilityList)) {
      return false;
    }
    if (!arraysEqual(this.commandList, dh.commandList)) {
      return false;
    }
    if (!arraysEqual(this.attributeList, dh.attributeList)) {
      return false;
    }
    if (!arraysEqual(this.fingerprints, dh.fingerprints)) {
      return false;
    }
    if (!arraysEqual(this.inlcudes, dh.inlcudes)) {
      return false;
    }
    return this.type === dh.type;
  }
}
