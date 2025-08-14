const scheduler = require("node-schedule");
import { randomUUID } from "crypto";
import { EntityService } from "../entity/entity-service";
import { ScheduleService, ScheduleType } from "./schedule-service";
import { deleteUserFile, parseUserYamlFile, readUserDir, saveUserYamlFile } from "../utils/file-utils";


const logger = require("./logger-service")({
  source: "ScheduleService",
});

export class ScheduleServiceNS implements ScheduleService {
  private _jobInfo: Map<string, ScheduleType> = new Map<string, ScheduleType>();
  private _entityService: EntityService;

  constructor() {}

  public set entityService(entityService: EntityService) {
    this._entityService = entityService;
  }

  private getEntityService(): EntityService {
    if (this._entityService == null) {
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

  public getSchedules(): ScheduleType[] {
    return Array.from(this._jobInfo.values());
  }

  public getSchedulesForEntity(
    entityType: string,
    entityId: string,
  ): ScheduleType[] {
    let jobKey = "_" + entityType + "_" + entityId + "_";
    //find jobs
    return Array.from(this._jobInfo.values()).filter((jobInfo) =>
      jobInfo.jobKey.includes(jobKey),
    );
  }

  unschedule(
    entityType: string,
    entityId: string,
    handlerMethod: string,
  ): void {
    this.unscheduleAndDeleteJob(null, entityType, entityId, handlerMethod);
  }

  public runIn(
    delayInSeconds: number,
    entityType: string,
    entityId: string,
    handlerMethod: string,
    options: any,
  ) {
    let jobKey: string;
    if (options?.overwrite === false) {
      jobKey = `runOnce_${entityType}_${entityId}_${handlerMethod}_${randomUUID()}`;
    } else {
      jobKey = `runOnce_${entityType}_${entityId}_${handlerMethod}`;
      //find existing jobs and cancel them.
      this.unscheduleAndDeleteJob(
        "runOnce",
        entityType,
        entityId,
        handlerMethod,
      );
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

    this.scheduleJob(jobSchedule);
    this.saveSchedule(jobKey, jobSchedule);
  }

  public scheduleEvery(
    schedule: string | Date,
    entityType: string,
    entityId: string,
    handlerMethod: string,
    options: any,
  ): void {
    let jobKey: string;
    if (options?.overwrite === false) {
      jobKey = `runEvery_${entityType}_${entityId}_${handlerMethod}_${randomUUID()}`;
    } else {
      jobKey = `runEvery_${entityType}_${entityId}_${handlerMethod}`;
      //find existing jobs and cancel them.
      this.unscheduleAndDeleteJob(
        "runEvery",
        entityType,
        entityId,
        handlerMethod,
      );
    }

    let cronExpression: string;
    if (typeof schedule === "string") {
      if (
        /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}-[0-9]{2}:[0-9]{2}/.test(
          schedule,
        )
      ) {
        let scheduleDate = new Date(Date.parse(schedule));
        cronExpression = this.dateToCron(scheduleDate);
      } else {
        cronExpression = schedule;
      }
    } else if (schedule instanceof Date) {
      cronExpression = this.dateToCron(schedule);
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
    this.scheduleJob(jobSchedule);
    this.saveSchedule(jobKey, jobSchedule);
  }

  private dateToCron(date: Date): string {
    return (
      date.getSeconds() +
      " " +
      date.getMinutes() +
      " " +
      date.getHours() +
      " * * *"
    );
  }

  public scheduleDate(
    date: Date,
    entityType: string,
    entityId: string,
    handlerMethod: string,
    options: any,
  ): void {
    let cronExpression = this.dateToCron(date);
    this.scheduleEvery(
      cronExpression,
      entityType,
      entityId,
      handlerMethod,
      options,
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
      scheduleService: ScheduleServiceNS,
    ) {
      try {
        if (jobSchedule.entityType === "SMARTAPP") {
          entityService
            .runSmartAppMethod(
              jobSchedule.entityId,
              jobSchedule.handlerMethod,
              jobSchedule.data,
            )
            .catch((err) => {
              //TODO: log this to the live log
              logger.warn(`error! scheduled method ${jobSchedule.handlerMethod}, app id ${jobSchedule.entityId}`, err);
            });
        } else if (jobSchedule.entityType === "DEVICE") {
          entityService.runDeviceMethod(
            jobSchedule.entityId,
            jobSchedule.handlerMethod,
            jobSchedule.data,
          );
        }

        // delete job if run once
        if (jobSchedule.jobType === "runOnce") {
          scheduleService.deleteJob(jobSchedule.jobKey);
        }
      } catch (err) {
        logger.warn("error with scheduled runIn", err);
      }
    }.bind(null, this.getEntityService(), this);
    return scheduler.scheduleJob(jobSchedule.jobKey, schedule, runInFunction);
  }

  private deleteJob(jobKey: string) {
    this._jobInfo.delete(jobKey);
    try {
      deleteUserFile(`config/schedules/${jobKey}.yaml`);
    } catch (err) {
      logger.warn("Unable to delete schedule file" + jobKey);
    }
  }

  private unscheduleAndDeleteJob(
    prefix: string,
    entityType: string,
    entityId: string,
    handlerMethod: string,
  ) {
    let jobKey =
      (prefix || "") +
      "_" +
      entityType +
      "_" +
      entityId +
      "_" +
      (handlerMethod || "");
    //find existing jobs and cancel them.
    for (let key of Object.keys(scheduler.scheduledJobs)) {
      if (key.includes(jobKey)) {
        scheduler.cancelJob(key);
        this.deleteJob(key);
      }
    }
  }

  private saveSchedule(jobKey: string, jobSchedule: ScheduleType) {
    this._jobInfo.set(jobKey, jobSchedule);
    saveUserYamlFile(`config/schedules/${jobKey}.yaml`, jobSchedule, false);
  }

  private _loadedSchedules = false;

  private loadSchedules(): void {
    if (this._loadedSchedules) {
      return;
    }
    this._loadedSchedules = true;

    try {
      const schDirFiles: string[] = readUserDir("config/schedules/")  
      schDirFiles.forEach((schDirFile) => {
        try {
          if (schDirFile.endsWith(".yaml")) {
            const parsedFile = parseUserYamlFile("config", "schedules", schDirFile);
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
            this._jobInfo.set(jobSchedule.jobKey, jobSchedule);
          }
        } catch (err) {
          logger.warn(`Error loading file ${schDirFile}`);
        }
      });
    } catch (err) {
      logger.warn(
        `Error loading files from config/schedules/: ${err.message}`,
      );
    }
  }
}
