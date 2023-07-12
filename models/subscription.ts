export class Subscription {
  id: string;
  deviceId: string;
  locationId: string;
  attributeNameAndValue: string;
  handlerMethod: string;
  subscribedAppId: string;
  filterEvents: boolean = true;

  public equals(that: Subscription): boolean {
    return (
      that.deviceId === this.deviceId &&
      that.locationId === this.locationId &&
      that.attributeNameAndValue === this.attributeNameAndValue &&
      that.handlerMethod === this.handlerMethod &&
      that.subscribedAppId === this.subscribedAppId &&
      that.filterEvents === this.filterEvents
    );
  }
}
