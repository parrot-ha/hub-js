//https://docs.smartthings.com/en/latest/ref-docs/zigbee-ref.html#zonestatus
// 0x41 = 0000 0000 0100 0001  (Trouble and Alarm1
export class ZoneStatus {
  private _zonestatus: number;

  constructor(zonestatus: number) {
    this._zonestatus = zonestatus;
  }

  public get alarm1(): number {
    return this._zonestatus & 0x01;
  }

  public isAlarm1Set(): boolean {
    return this.alarm1 == 1;
  }

  public get alarm2(): number {
    return (this._zonestatus & 0x02) >> 1;
  }

  public isAlarm2Set(): boolean {
    return this.alarm2 == 1;
  }

  public get tamper(): number {
    return (this._zonestatus & 0x04) >> 2;
  }

  public isTamperSet(): boolean {
    return this.tamper == 1;
  }

  public get battery(): number {
    return (this._zonestatus & 0x08) >> 3;
  }

  public isBatterySet(): boolean {
    return this.battery == 1;
  }

  public get supervisionReports(): number {
    return (this._zonestatus & 0x10) >> 4;
  }

  public isSupervisionReportsSet(): boolean {
    return this.supervisionReports == 1;
  }

  public get restoreReports(): number {
    return (this._zonestatus & 0x20) >> 5;
  }

  public isRestoreReportsSet(): boolean {
    return this.restoreReports == 1;
  }

  public get trouble(): number {
    return (this._zonestatus & 0x40) >> 6;
  }

  public isTroubleSet(): boolean {
    return this.trouble == 1;
  }

  public get ac(): number {
    return (this._zonestatus & 0x80) >> 7;
  }

  public isAcSet(): boolean {
    return this.ac == 1;
  }

  public get test(): number {
    return (this._zonestatus & 0x100) >> 8;
  }

  public isTestSet(): boolean {
    return this.test == 1;
  }

  public get batteryDefect(): number {
    return (this._zonestatus & 0x200) >> 9;
  }

  public isBatteryDefectSet(): boolean {
    return this.batteryDefect == 1;
  }
}
