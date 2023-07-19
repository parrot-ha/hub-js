import { randomUUID } from "crypto";
export class State {
  id: string;
  name: string;
  value: string;
  unit: string;
  date: Date;
  constructor(
    name: string,
    value: string,
    unit: string,
    date: Date = new Date(),
    id: string = randomUUID()
  ) {
    this.id = id;
    this.name = name;
    this.value = value;
    this.unit = unit;
    this.date = date;
  }

  get stringValue(): string {
    return this.value;
  }

  get numberValue(): number {
    return Number(this.value);
  }

  get dateValue(): Date {
    return new Date(this.value);
  }
}
