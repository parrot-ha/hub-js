class HubEvent {
  id: string;
  name: string;
  value: string;
  descriptionText: string;
  displayed: boolean;
  displayName: string;
  isStateChange: boolean;
  unit: string;
  data: string;
  date: Date;
  source: string;
  sourceId: string;
  isDigital: boolean;

  constructor(properties: Map<string, any>) {
    this.id = crypto.randomUUID();
    this.date = new Date();
    if (properties != null) {
      if (properties.get("name") != null) {
        this.name = properties.get("name");
      }
      if (properties.get("value") != null) {
        this.name = properties.get("value").toString();
      }
      // TODO: extract rest of properties
    }
  }
}
