export class DeviceSetting {
  name: string | undefined;
  value: string | undefined;
  type: string | undefined;
  multiple: boolean = false;

  constructor(name: string, value: string, type: string, multiple: boolean) {
    this.name = name;
    this.value = value;
    this.type = type;
    this.multiple = multiple;
  }
  
  public static buildFromObject(obj: any): DeviceSetting {
    return new DeviceSetting(obj.name, obj.value, obj.type, obj.multiple);
  }

  public getValueAsType(): any {
    if (this.value == null) {
      return null;
    } else if ("bool" === this.type) {
      return new Boolean(this.value);
    } else if (
      "boolean" === this.type ||
      "email" === this.type ||
      "text" === this.type ||
      "string" === this.type ||
      "enum" === this.type ||
      "time" === this.type
    ) {
      return this.value;
    } else if ("decimal" === this.type) {
      return parseFloat(this.value);
    } else if ("number" === this.type) {
      return parseInt(this.value);
      //TODO: handle hub, icon, password, phone
    } else {
      return this.value;
    }
  }
}
