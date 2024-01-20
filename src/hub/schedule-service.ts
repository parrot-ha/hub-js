export interface ScheduleService {
  initialize(): void;

  shutdown(): Promise<any>;

  getSchedules(): any;

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
