export class PreferencesBuilder {
  private _inputList: any[] = [];
  private _bodyList: any[] = [];

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
    let input: any = {
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

    let body: any = {
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

  public build(): any {
    let preferencesMap: any = {};
    let section: { input: any[]; body: any[] } = {
      input: this._inputList,
      body: this._bodyList,
    };
    let sections: { input: any[]; body: any[] }[] = [section];
    preferencesMap.put("sections", sections);
    return preferencesMap;
  }
}
