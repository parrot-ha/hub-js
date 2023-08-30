export class Fingerprint {
  profileId: string;
  endpointId: string;
  inClusters: string;
  private _sortedInClusters: string;
  outClusters: string;
  private _sortedOutClusters: string;
  model: string;
  manufacturer: string;
  application: string;
  deviceJoinName: string;
  mfr: string;
  prod: string;
  intg: string;

  public static buildFromObject(obj: any): Fingerprint {
    let fingerprint = new Fingerprint();
    fingerprint.profileId = obj.profileId;
    fingerprint.endpointId = obj.endpointId;
    fingerprint.inClusters = obj.inClusters;
    fingerprint.outClusters = obj.outClusters;
    fingerprint.model = obj.model;
    fingerprint.manufacturer = obj.manufacturer;
    fingerprint.application = obj.application;
    fingerprint.deviceJoinName = obj.deviceJoinName;
    fingerprint.mfr = obj.mfr;
    fingerprint.prod = obj.prod;
    fingerprint.intg = obj.intg;

    return fingerprint;
  }

  public get sortedInClusters(): string {
    if (this.inClusters != null && this._sortedInClusters == null) {
      this._sortedInClusters = this.inClusters.split(",").sort().join(",");
    }
    return this._sortedInClusters;
  }

  public get sortedOutClusters(): string {
    if (this.outClusters != null && this._sortedOutClusters == null) {
      this._sortedOutClusters = this.outClusters.split(",").sort().join(",");
    }
    return this._sortedOutClusters;
  }
}
