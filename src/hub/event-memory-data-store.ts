const logger = require("../hub/logger-service")({
  source: "EventMemoryDataStore",
});

import { ParrotEvent } from "../entity/models/event";
import { EventDataStore } from "./event-data-store";
import { isNotBlank } from "../utils/string-utils";

export class EventMemoryDataStore implements EventDataStore {
  private _events: Map<string, ParrotEvent[]> = new Map<
    string,
    ParrotEvent[]
  >();

  saveEvent(event: ParrotEvent): void {
    if (isNotBlank(event.source) && isNotBlank(event.sourceId)) {
      let key = `${event.source}${event.sourceId}`;
      if (this._events.get(key) == null) {
        this._events.set(key, []);
      }
      this._events.get(key).push(event);
      // only save 25 last events
      if (this._events.get(key).length > 25) {
        this._events.get(key).shift();
      }
    }
  }

  eventsSince(
    source: string,
    sourceId: string,
    date: Date,
    maxEvents: number
  ): ParrotEvent[] {
    //TODO: actually filter events
    if (isNotBlank(source) && isNotBlank(sourceId)) {
      return this._events.get(`${source}${sourceId}`);
    } else return null;
  }

  eventsBetween(
    source: string,
    sourceId: string,
    startDate: Date,
    endDate: Date,
    maxEvents: number
  ): ParrotEvent[] {
    //TODO: actually filter events
    if (isNotBlank(source) && isNotBlank(sourceId)) {
      return this._events.get(`${source}${sourceId}`);
    } else return null;

  }
}
