import { ParrotEvent } from "../entity/models/event";

export interface EventDataStore {
  saveEvent(event: ParrotEvent): void;

  eventsSince(
    source: string,
    sourceId: string,
    date: Date,
    maxEvents: number
  ): ParrotEvent[];

  eventsBetween(
    source: string,
    sourceId: string,
    startDate: Date,
    endDate: Date,
    maxEvents: number
  ): ParrotEvent[];
}
