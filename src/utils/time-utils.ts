import { toInteger } from "./object-utils";

const validHoursMins = /^-?\d{2}:\d{2}$/;

export function timeOffset(offset: string | number): number {
  if (offset == null) return 0;
  if (typeof offset === "number") {
    return offset * 60000;
  } else {
    if (isNaN(+offset)) {
      if (validHoursMins.test(offset)) {
        let hoursAndMins = offset.split(":");
        let mins = toInteger(hoursAndMins[1]);
        let hours = toInteger(hoursAndMins[0]);
        if (offset.startsWith("-")) {
          return hours * 3600000 - mins * 60000;
        } else {
          return hours * 3600000 + mins * 60000;
        }
      }
    } else {
      return toInteger(offset) * 60000;
    }
  }
}
