const schedule = require("node-schedule");
import { randomUUID } from "crypto";
import { EntityService } from "./entity-service";

export class ScheduleService {
  private _jobs: Map<string, any> = new Map<string, any>();
  private _entityService: EntityService;

  constructor(entityService: EntityService) {
    this._entityService = entityService;
  }

  public initialize(): void {
    //TODO: load schedules from file system or database
  }

  public shutdown(): Promise<any> {
    return schedule.gracefulShutdown();
  }

  public runIn(
    delayInSeconds: number,
    type: string,
    typeId: string,
    handlerMethod: string,
    options: any
  ) {
    console.log(
      `${new Date().toLocaleString()} runIn ${delayInSeconds} ${type} ${typeId} ${handlerMethod}`
    );
    
    let runInFunction = function (entityService: EntityService) {
      try {
        console.log(
          `${new Date().toLocaleString()} running runIn ${delayInSeconds} ${type} ${typeId} ${handlerMethod}`
        );
        console.log("entityService:", entityService != null)
        if (type === "SMARTAPP") {
            entityService.runSmartAppMethod(
            typeId,
            handlerMethod,
            options?.data
          );
        } else if (type === "DEVICE") {
            entityService.runDeviceMethod(
            typeId,
            handlerMethod,
            options?.data
          );
        }
      } catch (err) {
        console.log("error with scheduled runIn", err);
      }
    }.bind(null, this._entityService);

    const job = schedule.scheduleJob(
      new Date(Date.now() + delayInSeconds * 1000),
      runInFunction
    );
    if (options?.overwrite === false) {
      let jobKey = `runOnce_${type}_${typeId}_${handlerMethod}_${randomUUID()}`;
      this._jobs.set(jobKey, job);
    } else {
      //find existing jobs and cancel them.
      let jobKey = `runOnce_${type}_${typeId}_${handlerMethod}`;
      for (let key of this._jobs.keys()) {
        if (key.startsWith(jobKey)) {
          this._jobs.get(key).cancel();
          this._jobs.delete(key);
        }
      }
      //TODO: save schedules to file system or database
      this._jobs.set(jobKey, job);
    }
  }
}
