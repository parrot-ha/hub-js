import { ParrotEvent } from "./models/event";

export interface EventListener {
  eventReceived(event: ParrotEvent): void;
}
