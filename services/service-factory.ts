import { SmartAppFileDataStore } from "../data-store/smart-app-file-data-store";
import { DeviceFileDataStore } from "../data-store/device-file-data-store";
import { DeviceService } from "./device-service";
import { EntityService } from "./entity-service";
import { EventService } from "./event-service";
import { SmartAppService } from "./smart-app-service";
import { LocationService } from "./location-service";

export class ServiceFactory {
  private static instance: ServiceFactory;

  private constructor() {}

  public static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  private deviceService: DeviceService;

  getDeviceService(): DeviceService {
    if (!this.deviceService) {
      this.deviceService = new DeviceService(new DeviceFileDataStore());
    }
    return this.deviceService;
  }

  private smartAppService: SmartAppService;

  getSmartAppService(): SmartAppService {
    if (!this.smartAppService) {
      this.smartAppService = new SmartAppService(new SmartAppFileDataStore());
    }
    return this.smartAppService;
  }

  private entityService: EntityService;

  public getEntityService(): EntityService {
    if (!this.entityService) {
      this.entityService = new EntityService(
        this.getDeviceService(),
        this.getSmartAppService(),
        this.getEventService(),
        this.getLocationService()
      );
    }
    return this.entityService;
  }

  private eventService: EventService;

  public getEventService(): EventService {
    if (!this.eventService) {
      this.eventService = new EventService();
    }
    return this.eventService;
  }

  private _locationService: LocationService;

  public getLocationService(): LocationService {
    if (!this._locationService) {
      this._locationService = new LocationService();
    }
    return this._locationService;
  }
}
