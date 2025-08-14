import fs from "fs";
import fsAsync from "fs/promises";
import path from "path";
import YAML from "yaml";

const logger = require("../hub/logger-service")({
  source: "FileUtils",
});

let _fileNameMap: Map<string, string> = new Map();
let _saveTriggered = false;
let _timeoutId: NodeJS.Timeout = null;

//TODO: get home directory from configuration or default to userData/
export function getHomeDir(): string {
  return "userData/";
}

export function createUserDirectory(directory: string) {
  let newDirName = path.join(getHomeDir(), directory);
  if (!fs.existsSync(newDirName)) {
    fs.mkdirSync(newDirName);
  }
}

export function saveFileSync(fileName: string, contents: string) {
  saveFileToFilesystem(path.join(getHomeDir(), fileName), contents);
}

export function saveUserYamlFile(
  fileName: string,
  contents: any,
  saveEmptyFile: boolean = true,
) {
  saveUserFile(fileName, YAML.stringify(contents), saveEmptyFile);
}

//TODO: rename to saveFile and remove existing saveFile
export function saveUserFile(
  fileName: string,
  contents: string,
  saveEmptyFile: boolean = true,
) {
  saveFile(path.join(getHomeDir(), fileName), contents, saveEmptyFile);
}

export function saveFile(
  fileName: string,
  contents: string,
  saveEmptyFile: boolean,
) {
  if (saveEmptyFile || contents.trim().length > 0) {
    _fileNameMap.set(fileName, contents);
    if (!_saveTriggered) {
      _saveTriggered = true;
      _timeoutId = setTimeout(() => {
        saveFilesFromMap();
      }, 1000);
    }
  }
}

export function deleteUserFile(fileName: string) {
  deleteFile(path.join(getHomeDir(), fileName));
}

export function deleteFile(fileName: string) {
  _fileNameMap.delete(fileName);
  if (fs.existsSync(fileName)) {
    fs.unlinkSync(fileName);
  }
  if (fs.existsSync(fileName + ".bak")) {
    fs.unlinkSync(fileName + ".bak");
  }
}

export function readUserFile(...paths: string[]): string {
  return readFile(path.join(getHomeDir(), ...paths));
}

export function readFile(fileName: string, getBak: boolean = false): string {
  return fs.readFileSync(getBak ? fileName + ".bak" : fileName, "utf-8");
}

export function parseUserYamlFile(...paths: string[]): any {
  return parseYamlFile(path.join(getHomeDir(), ...paths));
}

function parseYamlFile(fileName: string): any {
  let parsedFile: any;
  try {
    const data = readFile(fileName);
    parsedFile = YAML.parse(data);
  } catch (err) {
    logger.warn(`Error loading YAML file ${fileName}`, err);
    const data = readFile(fileName, true);
    parsedFile = YAML.parse(data);
  }
  return parsedFile;
}

export function flushFiles(): Promise<void[]> {
  if (_timeoutId) {
    clearTimeout(_timeoutId);
    _timeoutId = null;
  }
  return Promise.all(saveFilesFromMap());
}

function saveFilesFromMap(): Promise<void>[] {
  let promiseArray: Promise<void>[] = [];
  console.log("saving all files");
  if (_fileNameMap != null && _fileNameMap.size > 0) {
    console.log("map is not empty");
    _fileNameMap.forEach((value, key, map) => {
      console.log("save file " + key);
      promiseArray.push(saveFileToFilesystem(key, value));
      map.delete(key);
    });
  }
  if (_fileNameMap.size > 0) {
    promiseArray.push(...saveFilesFromMap());
  } else {
    _saveTriggered = false;
  }
  return promiseArray;
}

function saveFileToFilesystem(
  fileName: string,
  contents: string,
): Promise<void> {
  if (fs.existsSync(fileName)) {
    fs.cpSync(fileName, fileName + ".bak", { force: true });
    fs.truncateSync(fileName);
  }

  return fsAsync.writeFile(fileName, contents);
}

export function readUserDir(...paths: string[]): string[] {
  return readDir(getHomeDir(), ...paths);
}

export function readDir(...paths: string[]): string[] {
  return fs.readdirSync(path.join(...paths));
}
