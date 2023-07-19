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
}
