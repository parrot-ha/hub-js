const schedule = require("node-schedule");
import { randomUUID } from "crypto";
import { EntityService } from "../entity/entity-service";
import YAML from "yaml";
import fs from "fs";

type ScheduleType = {
  jobType: string;
  entityType: string;
  entityId: string;
  handlerMethod: string;
  data: any;
  schedule: number | string;
};

const logger = require("./logger-service")({
  source: "ScheduleService",
});

export class ScheduleService {
  private _jobs: Map<string, any> = new Map<string, any>();
  private _entityService: EntityService;

  constructor(entityService: EntityService) {
    this._entityService = entityService;
  }

  public initialize(): void {
    //TODO: load schedules from file system
  }

  public shutdown(): Promise<any> {
    return schedule.gracefulShutdown();
  }

  public runIn(
    delayInSeconds: number,
    entityType: string,
    entityId: string,
    handlerMethod: string,
    options: any
  ) {
    let jobKey: string;
    if (options?.overwrite === false) {
      jobKey = `runOnce_${entityType}_${entityId}_${handlerMethod}_${randomUUID()}`;
    } else {
      //find existing jobs and cancel them.
      jobKey = `runOnce_${entityType}_${entityId}_${handlerMethod}`;
      for (let key of this._jobs.keys()) {
        if (key.startsWith(jobKey)) {
          this._jobs.get(key).cancel();
          this._jobs.delete(key);
        }
      }
    }

    let runInFunction = function (
      entityService: EntityService,
      scheduleService: ScheduleService
    ) {
      try {
        if (entityType === "SMARTAPP") {
          entityService.runSmartAppMethod(
            entityId,
            handlerMethod,
            options?.data
          );
        } else if (entityType === "DEVICE") {
          entityService.runDeviceMethod(entityId, handlerMethod, options?.data);
        }

        // delete job
        scheduleService.deleteJob(jobKey);
      } catch (err) {
        logger.warn("error with scheduled runIn", err);
      }
    }.bind(null, this._entityService, this);

    let scheduleRunTime = new Date(Date.now() + delayInSeconds * 1000);
    const job = schedule.scheduleJob(scheduleRunTime, runInFunction);
    let jobSchedule: ScheduleType = {
      jobType: "runOnce",
      entityType: entityType,
      entityId: entityId,
      handlerMethod: handlerMethod,
      data: options?.data || {},
      schedule: scheduleRunTime.getTime(),
    };

    this._jobs.set(jobKey, job);
    this.saveSchedule(jobKey, jobSchedule);
  }

  private deleteJob(jobKey: string) {
    this._jobs.delete(jobKey);
    try {
      let fileName: string = `userData/config/schedules/${jobKey}.yaml`;
      if (fs.existsSync(fileName)) {
        fs.unlinkSync(fileName);
      }
    } catch (err) {
      logger.warn("Unable to delete schedule file" + jobKey);
    }
  }

  private saveSchedule(jobKey: string, jobSchedule: ScheduleType) {
    let jobScheduleYaml = YAML.stringify(jobSchedule);
    if (jobScheduleYaml?.trim().length > 0) {
      fs.writeFile(
        `userData/config/schedules/${jobKey}.yaml`,
        jobScheduleYaml,
        (err: any) => {
          if (err) throw err;
        }
      );
    }
  }
}
