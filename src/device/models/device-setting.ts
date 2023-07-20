export class DeviceSetting {
  name: string | undefined;
  value: string | undefined;
  type: string | undefined;
  multiple: boolean = false;

  constructor(name: string, value: string, type: string, multiple: boolean) {
    this.name = name;
    this.processValueTypeAndMultiple(value, type , multiple);
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

  public processValueTypeAndMultiple(
    valueObject: any,
    type: string,
    multiple: boolean
  ): void {
    this.multiple = multiple;
    //TODO: if type changes, log a warning message.
    this.type = type;
    if (type != null) {
      if ("time" === this.type) {
        let value: string = null;
        if (valueObject != null) {
          value = valueObject.toString();
        }
        if (value == null || value.length == 0) {
          this.value = null;
        } else if (/[0-9]{2}:[0-9]{2}/.test(value)) {
          // format string as ISO
          let timeArray: string[] = value.split(":");
          let dateTime = new Date();
          dateTime.setHours(parseInt(timeArray[0]));
          dateTime.setMinutes(parseInt(timeArray[1]));
          //TODO: is this the correct format? should it be UTC?
          this.value = dateTime.toISOString();
        } else if (
          /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}-[0-9]{2}:[0-9]{2}/.test(
            value
          )
        ) {
          //TODO: is this the correct way to handle the string?
          this.value = new Date(value).toISOString();
        }
      } else {
        if (valueObject != null) {
          this.value = valueObject.toString();
        } else {
          this.value = null;
        }
      }
    }
  }
}
