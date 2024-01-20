import { ParrotEvent } from "./event";

export class ParrotEventWrapper {
  private _event: ParrotEvent;

  constructor(event: ParrotEvent) {
    this._event = event;
  }

  /**
   * A map of any additional data on the Event.
   *
   * @return string - A JSON string representing a map of the additional data (if any) on the Event.
   */
  get data(): string {
    return this._event.data;
  }

  get id(): string {
    return this._event.id;
  }

  get name(): string {
    return this._event.name;
  }

  get value(): string {
    return this._event.value;
  }

  get date(): Date {
    return this._event.date;
  }

  get descriptionText(): string {
    return this._event.descriptionText;
  }

  isDisplayed(): boolean {
    return this._event.displayed;
  }

  get displayName(): string {
    return this._event.displayName;
  }

  public isStateChange(): boolean {
    return this._event.isStateChange();
  }

  get unit(): string {
    return this._event.unit;
  }

  // public Date getDateValue() {
  //     //TODO: parse value into date
  //     throw new UnsupportedOperationException();
  // }

  get description(): string {
    return this._event.description;
  }

  // public DeviceWrapper getDevice() {
  //     return this._event.getDevice();
  // }

  // public String getDeviceId() {
  //     if ("DEVICE".equals(this._event.getSource()))
  //         return this._event.getSourceId();
  //     return null;
  // }

  // public Double getDoubleValue() {
  //     return Double.valueOf(this._event.getValue());
  // }

  // public Float getFloatValue() {
  //     return Float.valueOf(this._event.getValue());
  // }

  // public String getHubId() {
  //     return event.getHubId();
  // }

  // public String getInstalledSmartAppId() {
  //     return getInstalledAutomationAppId();
  // }

  // // parrot hub calls them Automation Apps
  // public String getInstalledAutomationAppId() {
  //     return this._event.getInstalledAutomationAppId();
  // }

  // public Integer getIntegerValue() {
  //     return Integer.valueOf(this._event.getValue());
  // }

  // public String getIsoDate() {
  //     return new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX").format(this._event.getDate());
  // }

  // public Object getJsonValue() {
  //     return new JsonSlurper().parseText(this._event.getValue());
  // }

  // public String getLinkText() {
  //     return getDisplayName();
  // }

  // public Object getLocation() {
  //     //TODO: implement
  //     throw new UnsupportedOperationException();
  // }

  // public String getLocationId() {
  //     return this._event.getLocationId();
  // }

  // public Long getLongValue() {
  //     return Long.valueOf(this._event.getValue());
  // }

  // public Number getNumberValue() throws ParseException {
  //     return NumberFormat.getInstance().parse(this._event.getValue());
  // }

  // public Number getNumericValue() throws ParseException {
  //     return getNumberValue();
  // }

  get source(): string {
    return this._event.source;
  }

  get sourceId(): string {
    return this._event.sourceId;
  }

  get stringValue(): string {
    return this._event.value;
  }

  // public Map<String, BigDecimal> getXyzValue() {
  //     //TODO: implement
  //     throw new UnsupportedOperationException();
  // }

  // public boolean isDigital() {
  //     return this._event.isDigital();
  // }

  // public boolean isPhysical() {
  //     return !isDigital();
  // }

  public toString() {
    //TODO: build rest of event
    return "Event(name: " + this.name + " value: " + this.value + ")";
  }

  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      value: this.value,
      date: this.date,
      source: this.source,
      sourceId: this.sourceId,
      descriptionText: this.descriptionText,
      isStateChange: this.isStateChange,
    };
  }
}
