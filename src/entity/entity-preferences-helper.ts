export function createStandardInput(params: any): any {
  // create a standard input with default values
  let tempInput: any = {
    description: "Tap to set",
    title: "Which?",
    multiple: false,
    required: true,
  };

  for (let key of Object.keys(params)) {
    tempInput[key] = params[key];
  }
  return tempInput;
}

export function createStandardPage(): any {
  let tempPage: any = {
    name: null,
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
    name: "label",
    title: "Add a name",
    description: "Tap to set",
    element: "label",
    type: "text",
    required: true,
  };
  for (let key of Object.keys(params)) {
    tempLabel[key] = params[key];
  }

  return tempLabel;
}
