export abstract class IntegrationEvent {
  private _integrationId: string;

  public get integrationId(): string {
    return this._integrationId;
  }

  public set integrationId(value: string) {
    this._integrationId = value;
  }
}

export class IntegrationHubEvent extends IntegrationEvent {
  private _name: string;
  private _value: string;
  private _description: string;
  private _stateChange: boolean = false;

  constructor(
    name: string,
    value: string,
    description: string,
    stateChange: boolean
  ) {
    super();
    this._name = name;
    this._value = value;
    this._description = description;
    this._stateChange = stateChange;
  }
}

/*
 * Device Events below
 */

export class DeviceEvent extends IntegrationEvent {
  private _deviceNetworkId: string;
  private _event: any;

  constructor(deviceNetworkId: string, event: any) {
    super();
    this._deviceNetworkId = deviceNetworkId;
    this._event = event;
  }

  public get deviceNetworkId(): string {
    return this._deviceNetworkId;
  }

  public get event(): any {
    return this._event;
  }
}
export class DeviceAddedEvent extends DeviceEvent {
  private _userInitiatedAdd: boolean;

  constructor(
    deviceNetworkId: string,
    userInitiatedAdd: boolean,
    fingerprint: Map<string, string>,
    data: Map<string, any>,
    parameters: Map<string, string>
  ) {
    super(
      deviceNetworkId,
      new Map<string, any>([
        ["fingerprint", fingerprint],
        ["data", data],
        ["parameters", parameters],
      ])
    );
    this._userInitiatedAdd = userInitiatedAdd;
  }

  public get isUserInitiatedAdd(): boolean {
    return this._userInitiatedAdd;
  }

  public get fingerprint(): Map<string, string> {
    return (this.event as Map<string, any>).get("fingerprint");
  }

  public get additionalParameters(): Map<string, string> {
    return (this.event as Map<string, any>).get("parameters");
  }

  public get data(): Map<string, any> {
    return (this.event as Map<string, any>).get("data");
  }
}

export class DeviceMessageEvent extends DeviceEvent {
  constructor(deviceNetworkId: string, message: string) {
    super(deviceNetworkId, { message: message });
  }

  public get message(): string {
    return this.event.message;
  }
}

export class LanDeviceMessageEvent extends DeviceMessageEvent {
  private _remoteAddress: string;
  private _remotePort: number;
  constructor(
    macAddress: string,
    remoteAddress: string,
    remotePort: number,
    message: string
  ) {
    super(macAddress, message);
    this._remoteAddress = remoteAddress;
    this._remotePort = remotePort;
  }

  public get remoteAddress(): string {
    return this._remoteAddress;
  }

  public get remotePort(): number {
    return this._remotePort;
  }

  public get macAddress(): string {
    return this.deviceNetworkId;
  }
}

export enum DeviceStatusType {
  ADDING,
  ADDED,
  ONLINE,
  OFFLINE,
  NOT_FOUND,
  REMOVING,
  REMOVED,
  UNKNOWN,
}

export class DeviceStatusEvent extends DeviceEvent {
  private _status: DeviceStatusType;
  constructor(deviceNetworkId: string, status: DeviceStatusType) {
    super(deviceNetworkId, { status: status });
  }

  public get status(): DeviceStatusType {
    return this.event.status;
  }
}
