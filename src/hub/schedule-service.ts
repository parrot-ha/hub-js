export type ScheduleType = {
  jobKey: string;
  jobType: string;
  entityType: string;
  entityId: string;
  handlerMethod: string;
  data: any;
  schedule: number | string;
};

export interface ScheduleService {
  initialize(): void;

  shutdown(): Promise<any>;

  getSchedules(): ScheduleType[];

  getSchedulesForEntity(entityType: string, entityId: string): ScheduleType[]

  unschedule(entityType: string, entityId: string, handlerMethod: string): void;

  runIn(
    delayInSeconds: number,
    entityType: string,
    entityId: string,
    handlerMethod: string,
    options: any
  ): void;

  scheduleEvery(
    schedule: string | Date,
    entityType: string,
    entityId: string,
    handlerMethod: string,
    options: any
  ): void;

  scheduleDate(
    date: Date,
    entityType: string,
    entityId: string,
    handlerMethod: string,
    options: any
  ): void;
}
