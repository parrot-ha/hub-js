import { SmartAppFileDataStore } from "../smartApp/smart-app-file-data-store";
import { DeviceFileDataStore } from "../device/device-file-data-store";
import { DeviceService } from "../device/device-service";
import { EntityService } from "../entity/entity-service";
import { EventService } from "./event-service";
import { SmartAppService } from "../smartApp/smart-app-service";
import { LocationService } from "./location-service";
import { ScheduleService } from "./schedule-service";
import { LocationFileDataStore } from "./location-file-data-store";
import { IntegrationService } from "../integration/integration-service";
import { IntegrationFileDataStore } from "../integration/integration-file-data-store";
import { IntegrationRegistry } from "../integration/integration-registry";

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
      this.deviceService = new DeviceService(
        new DeviceFileDataStore(),
        this.getIntegrationRegistry()
      );
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

  private _integrationService: IntegrationService;

  public getIntegrationService(): IntegrationService {
    if (!this._integrationService) {
      this._integrationService = new IntegrationService(
        new IntegrationFileDataStore(),
        this.getIntegrationRegistry(),
        this.getEntityService(),
        this.getDeviceService()
      );
    }
    return this._integrationService;
  }

  private _integrationRegistry: IntegrationRegistry;

  public getIntegrationRegistry(): IntegrationRegistry {
    if (!this._integrationRegistry) {
      this._integrationRegistry = new IntegrationRegistry();
    }
    return this._integrationRegistry;
  }
}
