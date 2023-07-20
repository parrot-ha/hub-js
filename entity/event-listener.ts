import { Event } from "../models/event";

export interface EventListener {
  eventReceived(event: Event): void;
}
