export class Hub {
  id: string;
  name: string;
  type: string;
  hardwareID: string;
  data: Map<string, any>;

  isBatteryInUse(): boolean {
    return false;
  }
  
}
