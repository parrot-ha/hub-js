import { HubAction } from "./hub-action";

export class HubMultiAction {
  private _actions: HubAction[] = [];

  constructor(stringActions: string[] = null) {
    if (stringActions) {
      for (let stringAction of stringActions) {
        this.actions.push(new HubAction(stringAction));
      }
    }
  }

  public add(action: any): void {
    if (typeof action === "string") {
      this._actions.push(new HubAction(action));
    } else if (action instanceof HubAction) {
      this._actions.push(action);
    }
  }

  public get actions(): HubAction[] {
    return this._actions;
  }
}
