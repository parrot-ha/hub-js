type InputType = {
  description: string;
  multiple: boolean;
  title: string;
  required: boolean;
  name: string;
  type: string;
  options: string[];
  displayDuringSetup: boolean;
};

type BodyType = {
  element: string;
  description: string;
  multiple: boolean;
  title: string;
  required: boolean;
  name: string;
  type: string;
  options: string[];
  displayDuringSetup: boolean;
};

type PreferencesType = { sections: any; defaults: boolean };

export class PreferencesBuilder {
  private _inputList: InputType[] = [];
  private _bodyList: BodyType[] = [];

  public withInput(
    type: string,
    name: string,
    title: string,
    description: string,
    options: string[],
    multiple: boolean,
    required: boolean,
    displayDuringSetup: boolean
  ): PreferencesBuilder {
    let input: InputType = {
      description: description,
      multiple: multiple,
      title: title,
      required: required,
      name: name,
      type: type,
      options: options,
      displayDuringSetup: displayDuringSetup,
    };

    this._inputList.push(input);

    let body: BodyType = {
      element: "input",
      description: description,
      multiple: multiple,
      title: title,
      required: required,
      name: name,
      type: type,
      options: options,
      displayDuringSetup: displayDuringSetup,
    };
    this._bodyList.push(body);

    return this;
  }

  public withTextInput(
    name: string,
    title: string,
    description: string,
    required: boolean,
    displayDuringSetup: boolean
  ): PreferencesBuilder {
    return this.withInput(
      "text",
      name,
      title,
      description,
      null,
      false,
      required,
      displayDuringSetup
    );
  }

  public withEnumInput(
    name: string,
    title: string,
    description: string,
    options: string[],
    multiple: boolean,
    required: boolean,
    displayDuringSetup: boolean
  ): PreferencesBuilder {
    return this.withInput(
      "enum",
      name,
      title,
      description,
      options,
      multiple,
      required,
      displayDuringSetup
    );
  }

  public withBoolInput(
    name: string,
    title: string,
    description: string,
    required: boolean,
    displayDuringSetup: boolean
  ): PreferencesBuilder {
    return this.withInput(
      "bool",
      name,
      title,
      description,
      null,
      false,
      required,
      displayDuringSetup
    );
  }

  public build(): PreferencesType {
    let section = { input: this._inputList, body: this._bodyList };
    let sections = [section];
    let preferencesMap = { sections: sections, defaults: true };
    return preferencesMap;
  }
}
