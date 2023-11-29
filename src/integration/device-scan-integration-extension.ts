export interface DeviceScanIntegrationExtension {
  startScan(options: Object): boolean;
  stopScan(options: Object): boolean;
  getScanStatus(options: Object): Object;
}
