import fs from "fs";
import YAML from "yaml";

const logger = require("../hub/logger-service")({
  source: "FileUtils",
});

let _fileNameMap: Map<string, string> = new Map();
let _saveTriggered = false;

export function saveFile(fileName: string, contents: string) {
  _fileNameMap.set(fileName, contents);
  if (!_saveTriggered) {
    _saveTriggered = true;
    setTimeout(() => {
      saveFilesFromMap();
    }, 1000);
  }
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

export function readFile(fileName: string, getBak: boolean = false): string {
  return fs.readFileSync(getBak ? fileName + ".bak" : fileName, "utf-8");
}

export function parseYamlFile(fileName: string): any {
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

export function flushFiles(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    saveFilesFromMap();
    logger.debug("flushed files");
    resolve(true);
  });
}

function saveFilesFromMap() {
  console.log("saving all files");
  if (_fileNameMap != null && _fileNameMap.size > 0) {
    console.log("map is not empty");
    _fileNameMap.forEach((value, key, map) => {
      console.log("save file " + key);
      saveFileToFilesystem(key, value);
      map.delete(key);
    });
  }
  if (_fileNameMap.size > 0) {
    saveFilesFromMap();
  } else {
    _saveTriggered = false;
  }
}

function saveFileToFilesystem(fileName: string, contents: string) {
  if (fs.existsSync(fileName)) {
    fs.cpSync(fileName, fileName + ".bak", { force: true });
    fs.truncateSync(fileName);
  }
  fs.writeFile(fileName, contents, (err: any) => {
    if (err) throw err;
  });
}
