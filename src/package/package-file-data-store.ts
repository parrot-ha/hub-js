import { getUserDefinedDataFolder } from "../utils/file-utils";
import * as fs from "fs";

const logger = require("../hub/logger-service")({
  source: "PackageFileDataStore",
});

export class PackageFileDataStore {
  public getPackages(): string[] {
    let packageDirectories: string[] = [];
    let packagesPath = getUserDefinedDataFolder() + "/packages/";
    if (fs.existsSync(packagesPath)) {
      let packageDirectoryContents = fs.readdirSync(packagesPath, {
        withFileTypes: true,
      });
      packageDirectoryContents.forEach((dirent) => {
        if (dirent.isDirectory()) {
          packageDirectories.push(dirent.name);
        }
      });
    }
    return packageDirectories;
  }
}