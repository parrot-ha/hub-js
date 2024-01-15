const scheduler = require("node-schedule");
import { randomUUID } from "crypto";
import { EntityService } from "../entity/entity-service";
import YAML from "yaml";
import fs from "fs";
import { ScheduleService } from "./schedule-service";

type ScheduleType = {
  jobKey: string;
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

export class ScheduleServiceNS implements ScheduleService {
  private _jobs: Map<string, any> = new Map<string, any>();
  private _entityService: EntityService;

  constructor() {  }

  public set entityService(entityService: EntityService) {
    this._entityService = entityService;
  }

  private getEntityService(): EntityService {
    if(this._entityService == null) {
      throw new Error("Entity Service is not set in Scheduler!");
    }
    return this._entityService;
  }

  public initialize(): void {
    //load schedules from file system
    this.loadSchedules();
  }

  public shutdown(): Promise<any> {
    return scheduler.gracefulShutdown();
  }

  public getSchedules() {
    return scheduler.scheduledJobs;
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
          this._jobs.get(key)?.cancel();
          this._jobs.delete(key);
        }
      }
    }

    let scheduleRunTime = new Date(Date.now() + delayInSeconds * 1000);
    let jobSchedule: ScheduleType = {
      jobKey: jobKey,
      jobType: "runOnce",
      entityType: entityType,
      entityId: entityId,
      handlerMethod: handlerMethod,
      data: options?.data || {},
      schedule: scheduleRunTime.getTime(),
    };

    const job = this.scheduleJob(jobSchedule);

    this._jobs.set(jobKey, job);
    this.saveSchedule(jobKey, jobSchedule);
  }

  public scheduleEvery(
    schedule: string | Date,
    entityType: string,
    entityId: string,
    handlerMethod: string,
    options: any
  ): void {
    let jobKey: string;
    if (options?.overwrite === false) {
      jobKey = `runEvery_${entityType}_${entityId}_${handlerMethod}_${randomUUID()}`;
    } else {
      //find existing jobs and cancel them.
      jobKey = `runEvery_${entityType}_${entityId}_${handlerMethod}`;
      for (let key of this._jobs.keys()) {
        if (key.startsWith(jobKey)) {
          this._jobs.get(key)?.cancel();
          this._jobs.delete(key);
        }
      }
    }

    let cronExpression: string;
    if (typeof schedule === "string") {
      let timestamp = Date.parse(schedule);
      if (isNaN(timestamp)) {
        cronExpression = schedule;
      } else {
        let scheduleDate = new Date(timestamp);
        cronExpression = `${
          scheduleDate.getSeconds
        } ${scheduleDate.getMinutes()} ${scheduleDate.getHours()} * * *`;
      }
    } else if (schedule instanceof Date) {
      cronExpression = `${
        schedule.getSeconds()
      } ${schedule.getMinutes()} ${schedule.getHours()} * * *`;
    } else {
      throw new Error("Invalid argument for schedule");
    }

    let jobSchedule: ScheduleType = {
      jobKey: jobKey,
      jobType: "runEvery",
      entityType: entityType,
      entityId: entityId,
      handlerMethod: handlerMethod,
      data: options?.data || {},
      schedule: cronExpression,
    };
    const job = this.scheduleJob(jobSchedule);
    this._jobs.set(jobKey, job);
    this.saveSchedule(jobKey, jobSchedule);
  }

  public scheduleDate(
    date: Date,
    entityType: string,
    entityId: string,
    handlerMethod: string,
    options: any
  ): void {
    let cronExpression = `${
      date.getSeconds
    } ${date.getMinutes()} ${date.getHours()} * * *`;
    this.scheduleEvery(
      cronExpression,
      entityType,
      entityId,
      handlerMethod,
      options
    );
  }

  private scheduleJob(jobSchedule: ScheduleType): any {
    let schedule: any;
    if (jobSchedule.jobType === "runOnce") {
      schedule = new Date(jobSchedule.schedule);
    } else if (jobSchedule.jobType === "runEvery") {
      schedule = jobSchedule.schedule;
    }
    let runInFunction = function (
      entityService: EntityService,
      scheduleService: ScheduleServiceNS
    ) {
      try {
        if (jobSchedule.entityType === "SMARTAPP") {
          entityService.runSmartAppMethod(
            jobSchedule.entityId,
            jobSchedule.handlerMethod,
            jobSchedule.data
          ).catch((err) => {
            //TODO: log this to the live log
            logger.warn("error! scheduled method", err);
          });
        } else if (jobSchedule.entityType === "DEVICE") {
          entityService.runDeviceMethod(
            jobSchedule.entityId,
            jobSchedule.handlerMethod,
            jobSchedule.data
          );
        }

        // delete job
        scheduleService.deleteJob(jobSchedule.jobKey);
      } catch (err) {
        logger.warn("error with scheduled runIn", err);
      }
    }.bind(null, this.getEntityService(), this);
    return scheduler.scheduleJob(schedule, runInFunction);
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

  private _loadedSchedules = false;

  private loadSchedules(): void {
    if (this._loadedSchedules) {
      return;
    }
    this._loadedSchedules = true;

    try {
      const schDirFiles: string[] = fs.readdirSync(
        "userData/config/schedules/"
      );
      schDirFiles.forEach((schDirFile) => {
        try {
          if (schDirFile.endsWith(".yaml")) {
            const data = fs.readFileSync(
              `userData/config/schedules/${schDirFile}`,
              "utf-8"
            );
            let parsedFile = YAML.parse(data);
            let jobSchedule: ScheduleType = {
              jobKey: parsedFile.jobKey,
              jobType: parsedFile.jobType,
              entityType: parsedFile.entityType,
              entityId: parsedFile.entityId,
              handlerMethod: parsedFile.handlerMethod,
              data: parsedFile.data,
              schedule: parsedFile.schedule,
            };
            let job = this.scheduleJob(jobSchedule);
            this._jobs.set(jobSchedule.jobKey, job);
          }
        } catch (err) {
          logger.warn(`Error loading file ${schDirFile}`);
        }
      });
    } catch (err) {
      logger.warn(
        `Error loading files from userData/config/schedules/: ${err.message}`
      );
    }
  }
}
