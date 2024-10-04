import { describe, expect, test } from "@jest/globals";
import { LocationService } from "./location-service";
import { LocationDataStore } from "./location-data-store";
import { Location } from "./models/location";

jest.mock("suncalc", () => {
  return {
    getTimes: jest.fn((dayToCalc, lattitude, longitude) => {
      return {
        sunrise: new Date("2024-09-16T06:24:41"),
        sunset: new Date("2024-09-16T19:11:23"),
      };
    }),
  };
});

describe("Test Get Sunrise and Sunset", () => {
  test("get sunrise and sunset", () => {
    let locationService = new LocationService(
      null as unknown as LocationDataStore,
    );
    let location = new Location();
    location.latitude = 123;
    location.longitude = 456;
    locationService.getLocation = jest.fn().mockReturnValue(location);
    let sunriseSunset = locationService.getSunriseAndSunset({});
    expect(sunriseSunset.sunrise.getHours()).toBe(6);
    expect(sunriseSunset.sunrise.getMinutes()).toBe(24);
    expect(sunriseSunset.sunrise.getSeconds()).toBe(41);
    expect(sunriseSunset.sunset.getHours()).toBe(19);
    expect(sunriseSunset.sunset.getMinutes()).toBe(11);
    expect(sunriseSunset.sunset.getSeconds()).toBe(23);
  });

  test("get sunrise with offset in minutes", () => {
    let locationService = new LocationService(
      null as unknown as LocationDataStore,
    );
    let location = new Location();
    location.latitude = 123;
    location.longitude = 456;
    locationService.getLocation = jest.fn().mockReturnValue(location);
    let sunriseSunset = locationService.getSunriseAndSunset({sunriseOffset: 15});
    expect(sunriseSunset.sunrise.getHours()).toBe(6);
    expect(sunriseSunset.sunrise.getMinutes()).toBe(39);
    expect(sunriseSunset.sunrise.getSeconds()).toBe(41);
    expect(sunriseSunset.sunset.getHours()).toBe(19);
    expect(sunriseSunset.sunset.getMinutes()).toBe(11);
    expect(sunriseSunset.sunset.getSeconds()).toBe(23);
  })

  test("get sunrise with offset in hours:minutes", () => {
    let locationService = new LocationService(
      null as unknown as LocationDataStore,
    );
    let location = new Location();
    location.latitude = 123;
    location.longitude = 456;
    locationService.getLocation = jest.fn().mockReturnValue(location);
    let sunriseSunset = locationService.getSunriseAndSunset({sunriseOffset: "01:30"});
    expect(sunriseSunset.sunrise.getHours()).toBe(7);
    expect(sunriseSunset.sunrise.getMinutes()).toBe(54);
    expect(sunriseSunset.sunrise.getSeconds()).toBe(41);
    expect(sunriseSunset.sunset.getHours()).toBe(19);
    expect(sunriseSunset.sunset.getMinutes()).toBe(11);
    expect(sunriseSunset.sunset.getSeconds()).toBe(23);
  })

  test("get sunset with negative offset in minutes", () => {
    let locationService = new LocationService(
      null as unknown as LocationDataStore,
    );
    let location = new Location();
    location.latitude = 123;
    location.longitude = 456;
    locationService.getLocation = jest.fn().mockReturnValue(location);
    let sunriseSunset = locationService.getSunriseAndSunset({sunsetOffset: -15});
    expect(sunriseSunset.sunrise.getHours()).toBe(6);
    expect(sunriseSunset.sunrise.getMinutes()).toBe(24);
    expect(sunriseSunset.sunrise.getSeconds()).toBe(41);
    expect(sunriseSunset.sunset.getHours()).toBe(18);
    expect(sunriseSunset.sunset.getMinutes()).toBe(56);
    expect(sunriseSunset.sunset.getSeconds()).toBe(23);
  })

  test("get sunset with negative offset in hours:minutes, only minutes", () => {
    let locationService = new LocationService(
      null as unknown as LocationDataStore,
    );
    let location = new Location();
    location.latitude = 123;
    location.longitude = 456;
    locationService.getLocation = jest.fn().mockReturnValue(location);
    let sunriseSunset = locationService.getSunriseAndSunset({sunsetOffset: "-00:45"});
    expect(sunriseSunset.sunrise.getHours()).toBe(6);
    expect(sunriseSunset.sunrise.getMinutes()).toBe(24);
    expect(sunriseSunset.sunrise.getSeconds()).toBe(41);
    expect(sunriseSunset.sunset.getHours()).toBe(18);
    expect(sunriseSunset.sunset.getMinutes()).toBe(26);
    expect(sunriseSunset.sunset.getSeconds()).toBe(23);
  })

  test("get sunset with negative offset in hours:minutes, hours and minutes", () => {
    let locationService = new LocationService(
      null as unknown as LocationDataStore,
    );
    let location = new Location();
    location.latitude = 123;
    location.longitude = 456;
    locationService.getLocation = jest.fn().mockReturnValue(location);
    let sunriseSunset = locationService.getSunriseAndSunset({sunsetOffset: "-01:45"});
    expect(sunriseSunset.sunrise.getHours()).toBe(6);
    expect(sunriseSunset.sunrise.getMinutes()).toBe(24);
    expect(sunriseSunset.sunrise.getSeconds()).toBe(41);
    expect(sunriseSunset.sunset.getHours()).toBe(17);
    expect(sunriseSunset.sunset.getMinutes()).toBe(26);
    expect(sunriseSunset.sunset.getSeconds()).toBe(23);
  })
});
