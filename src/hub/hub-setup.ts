import fs from "fs";
import { ServiceFactory } from "./service-factory";
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
  if (!fs.existsSync("userData/config/schedules/")) {
    fs.mkdirSync("userData/config/schedules/");
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

  ServiceFactory.getInstance().getScheduleService().initialize();

  ServiceFactory.getInstance().getIntegrationService().initialize();
}

export function shutdownSystem(): Promise<any> {
  let deviceServiceShutdownPromise = ServiceFactory.getInstance()
    .getDeviceService()
    .shutdown();
  let scheduleShutdownPromise =
    ServiceFactory.getInstance().getScheduleService().shutdown();
  let integrationShutdownPromise = ServiceFactory.getInstance().getIntegrationService().shutdown();
  return Promise.all([deviceServiceShutdownPromise, scheduleShutdownPromise, integrationShutdownPromise]);
}
