export function createStandardInput(params: any): any {
  // create a standard input with default values
  let tempInput: any = {
    description: "Tap to set",
    title: "Which?",
    multiple: false,
    required: false,
  };

  for (let key of Object.keys(params)) {
    tempInput[key] = params[key];
  }
  // don't allow overriding the element type
  tempInput.element = "input";
  return tempInput;
}

export function createStandardPage(): any {
  let tempPage: any = {
    name: null,
    title: null,
    nextPage: null,
    previousPage: null,
    content: null,
    install: false,
    uninstall: false,
    refreshInterval: -1,
    sections: [],
    popToAncestor: null,
    onUpdate: null,
  };

  return tempPage;
}

export function createLabel(params: any): any {
  let tempLabel: any = {
    title: "Add a name",
    description: "Tap to set",
    required: true,
  };
  for (let key of Object.keys(params)) {
    tempLabel[key] = params[key];
  }
  // don't allow overriding name, type and element
  tempLabel.name = "label";
  tempLabel.type = "text";
  tempLabel.element = "label";
  return tempLabel;
}

export function createMode(params: any): any {
  let tempMode: any = {
    title: "Set for specific mode(s)",
    description: "Choose Modes",
    required: false,
  };
  for (let key of Object.keys(params)) {
    tempMode[key] = params[key];
  }

  // don't allow overriding name, type and element
  tempMode.name = "mode";
  tempMode.type = "enum";
  tempMode.element = "mode";

  return tempMode;
}
