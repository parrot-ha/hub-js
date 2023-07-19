import fs from "fs";
import { ServiceFactory } from "./service-factory";
import winston from "winston";
// setup the system at start

// create any user directories needed
function createDirectories() {
  if (!fs.existsSync("userData/")) {
    fs.mkdirSync("userData/");
  }
  if (!fs.existsSync("userData/config/")) {
    fs.mkdirSync("userData/config/");
  }
  if (!fs.existsSync("userData/config/devices/")) {
    fs.mkdirSync("userData/config/devices/");
  }
  if (!fs.existsSync("userData/config/installedSmartApps/")) {
    fs.mkdirSync("userData/config/installedSmartApps/");
  }
  if (!fs.existsSync("userData/deviceHandlers/")) {
    fs.mkdirSync("userData/deviceHandlers/");
  }
  if (!fs.existsSync("userData/smartApps/")) {
    fs.mkdirSync("userData/smartApps/");
  }
}

export function setupSystem() {
  createDirectories();
  ServiceFactory.getInstance().getDeviceService().initialize();

  ServiceFactory.getInstance().getSmartAppService().initialize();

  // create logger
  //TODO: create logger module
  winston.loggers.add('parrotLogger', {
    transports: [
      new winston.transports.Console({ level: 'silly' }),
      new winston.transports.File({ filename: 'parrothub.log' })
    ]
  });


}

export function shutdownSystem() {
  ServiceFactory.getInstance().getDeviceService().shutdown();
}
