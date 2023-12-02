import {
  createStandardPage,
  createStandardInput,
  createLabel,
  createMode,
} from "../entity/entity-preferences-helper";

export class SmartAppMetadataDelegate {
  private _includeDefinition: boolean;
  private _includePreferences: boolean;
  private _includeMappings: boolean;
  private _sandboxMethods: string[] = [
    "definition",
    "preferences",
    "section",
    "input",
    "page",
    "dynamicPage",
    "mappings",
    "path",
  ];
  metadataValue: any = {
    definition: {},
    preferences: {},
    mappings: {},
  };

  private temporarySection: any = null;
  private temporaryPage: any = null;
  private singlePreferencesPage: boolean = false;

  constructor(
    includeDefinition: boolean = true,
    includePreferences: boolean = false,
    includeMappings: boolean = false
  ) {
    this._includeDefinition = includeDefinition;
    this._includePreferences = includePreferences;
    this._includeMappings = includeMappings;
  }

  get sandboxMethods() {
    return this._sandboxMethods;
  }

  public mappings(closure: Function) {
    if (this._includeMappings) {
      this.metadataValue.mappings = {};
      closure();
    }
  }

  public path(path: string, actions: any) {
    if (typeof actions === "object") {
      let action = actions["action"];
      if (typeof action === "object") {
        this.metadataValue.mappings[path] = action;
      }
    }
  }

  public definition(definitionInfo: any) {
    if (this._includeDefinition) {
      this.metadataValue.definition = definitionInfo;
    }
  }

  public preferences(closure: Function) {
    if (this._includePreferences) {
      this.metadataValue.preferences = {};
      closure();
      this.addTemporarySection();
      if (this.singlePreferencesPage) {
        this.section({}, () => {
          // create new section with default values (app name and modes)
          this.label({});
          this.mode({});
        });
      }
      this.addTemporaryPage();
    }
  }

  public dynamicPage(params: any, closure: Function) {
    this.temporaryPage = createStandardPage();

    for (let key of Object.keys(params)) {
      this.temporaryPage[key] = params[key];
    }

    if (closure != null) {
      closure();
    }

    let newDynamicPage: any = JSON.parse(JSON.stringify(this.temporaryPage));

    this.temporaryPage = null;
    return newDynamicPage;
  }

  //ST allowed:
  // page "name"
  // page "name", "title"
  // page name: "name", title: "title", ...
  // page name: "name", title: "title", ..., Closure to run
  // Parrot allows:
  // page("name")
  // page("name", "title")
  // page({name: "name", title: "title", ...})
  // page({name: "name", title: "title", ...}, Function to run)
  public page(param1: any, param2: any): void {
    if (!param1 && !param2) {
      throw new Error("No parameters passed to page() function");
    }
    // if param2 is a function, then param1 must be an object
    if (typeof param2 === "function" && typeof param1 !== "object") {
      throw new Error("Invalid arguments passed to page() function");
    }
    this.temporaryPage = createStandardPage();

    if (typeof param1 === "string") {
      this.temporaryPage.name = param1;
    } else if (typeof param1 === "object") {
      for (let key of Object.keys(param1)) {
        this.temporaryPage[key] = param1[key];
      }
      if (param2 != null && typeof param2 === "function") {
        param2();
      } else {
        //dynamic page
        if (!this.temporaryPage.content) {
          this.temporaryPage.content = this.temporaryPage.name;
        }
      }
    }
    if (typeof param2 === "string") {
      this.temporaryPage.title = param2;
    }

    this.addTemporaryPage();
  }

  // ST allowed:
  // section("title") {closure}
  // section {closure}
  // section([title: "my title"]) {closure}
  // Parrot allows:
  // section("title", functionToRun)
  // section({title: "my title"}, functionToRun)
  // section(functionToRun)
  public section(param1: any, param2: any) {
    this.createTemporarySection();
    if (typeof param1 === "string") {
      this.temporarySection.title = param1;
      if (typeof param2 === "function") {
        param2();
      }
    } else if (typeof param1 === "function") {
      param1();
    } else if (typeof param1 === "object") {
      for (const key in param1) {
        this.temporarySection[key] = param1[key];
      }
      if (typeof param2 === "function") {
        param2();
      }
    }

    this.addTemporarySection();
  }

  //ST Allowed:
  // input "name", "type", required: true, ...
  // input name: "name", type: "text", ...
  // parrot allows:
  // input("name", "type", {required: true ...});
  // input({name: "name", type: "type", required: true ...});
  public input(param1: any, param2: any, param3: any) {
    this.createTemporarySection();
    let tempInput: any;

    if (typeof param1 === "string" && typeof param2 === "string") {
      if (param3 && typeof param3 === "object") {
        param3.name = param1;
        param3.type = param2;
      } else {
        param3 = { name: param1, type: param2 };
      }
      tempInput = createStandardInput(param3);
    } else if (typeof param1 === "object") {
      tempInput = createStandardInput(param1);
    } else {
      tempInput = createStandardInput({});
    }
    this.temporarySection.input.push(tempInput);
    this.temporarySection.body.push(tempInput);
  }

  public label(params: any): void {
    this.createTemporarySection();
    let tempLabel: any = createLabel(params);
    //only add label to body, not input since this is a special input type (app name)
    this.temporarySection.body.push(tempLabel);
  }

  public mode(params: any): void {
    this.createTemporarySection();
    let tempMode: any = createMode(params);
    //only add mode to body, not input since this is a special input type (app mode)
    this.temporarySection.body.push(tempMode);
  }

  public app(params: any): void {
    this.createTemporarySection();
    // create a child app input with default values
    let tempApp: any = {
      element: "app",
      type: "app",
      multiple: false,
      title: "",
      name: "",
    };

    if (params) {
      for (const key in params) {
        tempApp[key] = params[key];
      }
    }

    this.temporarySection.body.push(tempApp);
  }

  /**
   * Create a paragraph item
   * @param params Can be an object with various parameters or a string for just populating the description
   */
  // ST allowed:
  // paragraph "description"
  // paragraph "description", title: "my title", ...
  // paragraph title: "my title", description: "my description" ...
  // Parrot allows:
  // paragraph("description")
  // paragraph("description", {title: "my title", ...})
  // paragraph({description: "description", title: "my title", ...})
  public paragraph(param1: any, param2: any): void {
    this.createTemporarySection();

    // create a standard paragraph with default values
    let tempParagraph: any = {
      title: "",
      description: "",
      element: "paragraph",
      type: "paragraph",
      // defaults to false
      required: false,
      multiple: false,
    };
    if (typeof param1 === "string") {
      tempParagraph.page = param1;
    } else if (typeof param1 === "object") {
      for (const key in param1) {
        tempParagraph[key] = param1[key];
      }
    }

    if (param2 && typeof param2 === "object") {
      for (const key in param2) {
        tempParagraph[key] = param2[key];
      }
    }
    this.temporarySection.body.push(tempParagraph);
  }

  // ST allowed:
  // href "pageName"
  // href "pageName", name: "name", description: ...
  // href name: "name", description: "description"...
  public href(param1: any, param2: any): void {
    this.createTemporarySection();

    let tempHref: any = {
      title: "Next Page",
      description: "Tap to show",
      element: "href",
      external: false,
      required: false,
    };

    if (typeof param1 === "string") {
      tempHref.page = param1;
    } else if (typeof param1 === "object") {
      for (const key in param1) {
        tempHref[key] = param1[key];
      }
    }

    if (param2 && typeof param2 === "object") {
      for (const key in param2) {
        tempHref[key] = param2[key];
      }
    }

    this.temporarySection.body.push(tempHref);
  }

  private createTemporarySection() {
    if (!this.temporarySection) {
      if (!this.temporaryPage) {
        this.singlePreferencesPage = true;
        this.temporaryPage = createStandardPage();
      }
      this.temporarySection = {
        input: [],
        body: [],
        hideable: false,
        hidden: false,
      };
    }
  }

  private addTemporarySection() {
    if (this.temporarySection) {
      this.temporaryPage.sections.push(this.temporarySection);

      this.temporarySection = null;
    }
  }

  private addTemporaryPage() {
    if (this.temporaryPage) {
      if (!this.metadataValue.preferences.pageList) {
        this.metadataValue.preferences.pageList = [];
      }

      this.metadataValue.preferences.pageList.push(this.temporaryPage);

      this.temporaryPage = null;
    }
  }
}
