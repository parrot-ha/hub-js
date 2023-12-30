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

  public static fromJSON(json: any) {
    let s: State = new State(null, null, null);
    if (json != null && typeof json === "object") {
      s.id = json.id;
      s.value = json.value;
      s.name = json.name;
      s.date = new Date(json.date);
    }
    return s;
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
