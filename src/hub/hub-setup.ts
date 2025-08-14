import { ServiceFactory } from "./service-factory";
import { flushFiles } from "../utils/file-utils";
import { createUserDirectory } from "../utils/file-utils";
// setup the system at start

// create any user directories needed
function createDirectories() {
  createUserDirectory("/");
  createUserDirectory("config/");
  createUserDirectory("config/devices/");
  createUserDirectory("config/installedSmartApps/");
  createUserDirectory("config/schedules/");
  createUserDirectory("deviceHandlers/");
  createUserDirectory("smartApps/");
  createUserDirectory("packages/");
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
  let scheduleShutdownPromise = ServiceFactory.getInstance()
    .getScheduleService()
    .shutdown();
  let integrationShutdownPromise = ServiceFactory.getInstance()
    .getIntegrationService()
    .shutdown();
  return Promise.all([
    deviceServiceShutdownPromise,
    scheduleShutdownPromise,
    integrationShutdownPromise,
  ]).then(() => flushFiles());
}
