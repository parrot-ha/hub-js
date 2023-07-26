export class IntegrationSetting {
  private _id: string;
  private _name: string;
  private _value: string;
  private _type: string;
  private _multiple: boolean;

  public get id(): string {
    return this._id;
  }
  public set id(value: string) {
    this._id = value;
  }
  public get name(): string {
    return this._name;
  }
  public set name(value: string) {
    this._name = value;
  }
  public get value(): string {
    return this._value;
  }
  public set value(value: string) {
    this._value = value;
  }
  public get type(): string {
    return this._type;
  }
  public set type(value: string) {
    this._type = value;
  }
  public get multiple(): boolean {
    return this._multiple;
  }
  public set multiple(value: boolean) {
    this._multiple = value;
  }

  public getValueAsType(): any {
    if (this._value == null) {
      return null;
    } else if ("bool" === this._type) {
      return new Boolean(this._value);
    } else if (
      "boolean" === this._type ||
      "email" === this._type ||
      "text" === this._type ||
      "string" === this._type ||
      "enum" === this._type ||
      "time" === this._type
    ) {
      return this._value;
    } else if ("decimal" === this._type) {
      return parseFloat(this._value);
    } else if ("number" === this._type) {
      return parseInt(this._value);
      //TODO: handle hub, icon, password, phone
    } else {
      return this._value;
    }
  }

  public processValueTypeAndMultiple(
    valueObject: any,
    type: string,
    multiple: boolean
  ): void {
    this._multiple = multiple;
    //TODO: if type changes, log a warning message.
    this._type = type;
    if (type != null) {
      if ("time" === this._type) {
        let value: string = null;
        if (valueObject != null) {
          value = valueObject.toString();
        }
        if (value == null || value.length == 0) {
          this._value = null;
        } else if (/[0-9]{2}:[0-9]{2}/.test(value)) {
          // format string as ISO
          let timeArray: string[] = value.split(":");
          let dateTime = new Date();
          dateTime.setHours(parseInt(timeArray[0]));
          dateTime.setMinutes(parseInt(timeArray[1]));
          //TODO: is this the correct format? should it be UTC?
          this._value = dateTime.toISOString();
        } else if (
          /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}-[0-9]{2}:[0-9]{2}/.test(
            value
          )
        ) {
          //TODO: is this the correct way to handle the string?
          this._value = new Date(value).toISOString();
        }
      } else {
        if (valueObject != null) {
          this._value = valueObject.toString();
        } else {
          this._value = null;
        }
      }
    }
  }

  public toJSON(includeValueAsType: boolean = false) {
    if (includeValueAsType) {
      return {
        id: this._id,
        name: this._name,
        type: this._type,
        value: this.getValueAsType(),
        multiple: this._multiple,
      };
    } else {
      return {
        id: this._id,
        name: this._name,
        type: this._type,
        value: this._value,
        multiple: this._multiple,
      };
    }
  }

  public static fromJSON(json: any) {
    let intSetting: IntegrationSetting = new IntegrationSetting();
    if (json != null) {
      intSetting.id = json.id;
      intSetting.name = json.name;
      intSetting.type = json.type;
      intSetting.value = json.value;
      intSetting.multiple = json.multiple;
    }
    return intSetting;
  }

  public toString(): string {
    return (
      "IntegrationSetting{" +
      "id='" +
      this._id +
      "'" +
      ", name='" +
      this._name +
      "'" +
      ", value='" +
      this._value +
      "'" +
      ", type='" +
      this._type +
      "'" +
      ", multiple=" +
      this._multiple +
      "}"
    );
  }
}
