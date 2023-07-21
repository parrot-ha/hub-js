import { isEmpty } from "../../utils/string-utils";

export class InstalledSmartAppSetting {
  id: string | undefined;
  name: string | undefined;
  value: string | undefined;
  type: string | undefined;
  multiple: boolean = false;

  public getValueAsType(): any {
    if (this.value != null) {
      if ("bool" === this.type) {
        return new Boolean(this.value);
      } else if (
        "boolean" === this.type ||
        "email" === this.type ||
        "text" === this.type ||
        "time" === this.type ||
        "password" === this.type
      ) {
        return this.value;
      } else if ("decimal" === this.type) {
        return parseFloat(this.value);
      } else if ("number" === this.type) {
        return parseInt(this.value);
      } else if ("enum" === this.type) {
        if (this.multiple) {
          if (this.value != null && this.value.trim().length > 0) {
            if (this.value.startsWith("[") || this.value.startsWith("{")) {
              return JSON.parse(this.value);
            } else {
              return [this.value];
            }
          } else {
            return [];
          }
        }
        return this.value;
      } else if (this.type != null && this.type.startsWith("capability")) {
        // returns the value as an array if multiple is true
        if (this.multiple) {
          if (this.value != null && this.value.trim().length > 0) {
            return JSON.parse(this.value);
          } else {
            return [];
          }
        }
        return this.value;
      }
    } else {
      return null;
    }
    //TODO; handle hub, icon, phone
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
        if (isEmpty(value)) {
          this.value = null;
        } else if (value.trim().length < 6 && /[0-9]{2}:[0-9]{2}/.test(value)) {
          // format string as ISO
          let timeArray: string[] = value.split(":");
          let date = new Date();
          date.setHours(parseInt(timeArray[0]));
          date.setMinutes(parseInt(timeArray[1]));

          this.value = date.toISOString();
        } else if (
          /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}[-+][0-9]{2}:[0-9]{2}/.test(
            value
          )
        ) {
          //2020-11-29T21:26:00.000-06:00
          this.value = new Date(value).toISOString();
        } else if (
          /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z/.test(
            value
          )
        ) {
          //2020-11-29T21:26:00.000-06:00
          this.value = new Date(value).toISOString();
        }
      } else if (type.startsWith("capability") && this.multiple) {
        if (valueObject != null) {
          if (Array.isArray(valueObject)) {
            this.value = JSON.stringify(valueObject);
          } else {
            this.value = valueObject.toString();
          }
        } else {
          this.value = null;
        }
      } else if (type === "enum" && this.multiple) {
        if (valueObject != null) {
          if (Array.isArray(valueObject)) {
            this.value = JSON.stringify(valueObject);
          } else {
            this.value = valueObject.toString();
          }
        } else {
          this.value = null;
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

  public toJSON(includeValueAsType: boolean = false): any {
    let json: any = {
      id: this.id,
      name: this.name,
      type: this.type,
      multiple: this.multiple,
    };
    if (includeValueAsType) {
      json.value = this.getValueAsType();
    } else {
      json.value = this.value;
    }

    return json;
  }
}
