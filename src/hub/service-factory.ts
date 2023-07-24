import { SmartAppFileDataStore } from "../smartApp/smart-app-file-data-store";
import { DeviceFileDataStore } from "../device/device-file-data-store";
import { DeviceService } from "../device/device-service";
import { EntityService } from "../entity/entity-service";
import { EventService } from "./event-service";
import { SmartAppService } from "../smartApp/smart-app-service";
import { LocationService } from "./location-service";
import { ScheduleService } from "./schedule-service";
import { LocationFileDataStore } from "./location-file-data-store";

export class ServiceFactory {
  private static _instance: ServiceFactory;

  private constructor() {}

  public static getInstance(): ServiceFactory {
    if (!ServiceFactory._instance) {
      ServiceFactory._instance = new ServiceFactory();
    }
    return ServiceFactory._instance;
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
      this._locationService = new LocationService(new LocationFileDataStore());
    }
    return this._locationService;
  }

  private _scheduleService: ScheduleService;

  public getScheduleService(): ScheduleService {
    if (!this._scheduleService) {
      this._scheduleService = new ScheduleService(this.getEntityService());
    }
    return this._scheduleService;
  }
}
