import { Attribute } from "./attribute";
import { Capability } from "./capability";
import { Command } from "./command";
import { CommandArgument } from "./command-argument";

export class Capabilities {
  private static capabilityMap: any;

  private static createMap() {
    if (this.capabilityMap) {
      return;
    }
    this.capabilityMap = {};

    this.capabilityMap["AccelerationSensor"] = new Capability(
      "AccelerationSensor",
      "capability.accelerationSensor",
      [new Attribute("ENUM", "acceleration", ["active", "inactive"])],
      null
    );

    this.capabilityMap["Actuator"] = new Capability(
      "Actuator",
      "capability.actuator",
      null,
      null
    );

    this.capabilityMap["AudioVolume"] = new Capability(
      "AudioVolume",
      "capability.audioVolume",
      [new Attribute("NUMBER", "volume")],
      [
        new Command("setVolume", [new CommandArgument("volume", "NUMBER")]),
        new Command("volumeUp"),
        new Command("volumeDown"),
      ]
    );

    this.capabilityMap["Battery"] = new Capability(
      "Battery",
      "capability.battery",
      [new Attribute("NUMBER", "battery")],
      null
    );

    this.capabilityMap["Configuration"] = new Capability(
      "Configuration",
      "capability.configuration",
      null,
      [new Command("configure")]
    );

    this.capabilityMap["ContactSensor"] = new Capability(
      "ContactSensor",
      "capability.contactSensor",
      [new Attribute("ENUM", "contact", ["open", "closed"])],
      null
    );

    this.capabilityMap["IlluminanceMeasurement"] = new Capability(
      "IlluminanceMeasurement",
      "capability.illuminanceMeasurement",
      [new Attribute("NUMBER", "illuminance")],
      null
    );

    this.capabilityMap["Lock"] = new Capability(
      "Lock",
      "capability.lock",
      [
        new Attribute("ENUM", "lock", [
          "locked",
          "unlocked",
          "unknown",
          "unlocked with timeout",
        ]),
      ],
      [new Command("lock"), new Command("unlock")]
    );

    this.capabilityMap["LockCodes"] = new Capability(
      "LockCodes",
      "capability.lockCodes",
      [
        new Attribute("ENUM", "codeChanged", [
          "added",
          "changed",
          "deleted",
          "failed",
        ]),
        new Attribute("NUMBER", "codeLength"),
        new Attribute("JSON_OBJECT", "lockCodes"),
        new Attribute("NUMBER", "maxCodes"),
      ],
      [
        new Command("deleteCode", [
          new CommandArgument("codePosition", "NUMBER"),
        ]),
        new Command("getCodes"),
        new Command("setCode", [
          new CommandArgument("codePosition", "NUMBER", true),
          new CommandArgument("pinCode", "STRING", true),
          new CommandArgument("name", "STRING", false),
        ]),
        new Command("setCodeLength", [
          new CommandArgument("pinCodeLength", "NUMBER", true),
        ]),
      ]
    );

    this.capabilityMap["MotionSensor"] = new Capability(
      "MotionSensor",
      "capability.motionSensor",
      [new Attribute("ENUM", "motion", ["action", "inactive"])],
      null
    );

    this.capabilityMap["Outlet"] = new Capability(
      "Outlet",
      "capability.outlet",
      [new Attribute("ENUM", "switch", ["on", "off"])],
      [new Command("on"), new Command("off")]
    );

    this.capabilityMap["Polling"] = new Capability(
      "Polling",
      "capability.polling",
      null,
      [new Command("poll")]
    );

    this.capabilityMap["PowerMeter"] = new Capability(
      "PowerMeter",
      "capability.powerMeter",
      [new Attribute("NUMBER", "power")],
      null
    );

    this.capabilityMap["Refresh"] = new Capability(
      "Refresh",
      "capability.refresh",
      null,
      [new Command("refresh")]
    );

    this.capabilityMap["RelativeHumidityMeasurement"] = new Capability(
      "RelativeHumidityMeasurement",
      "capability.relativeHumidityMeasurement",
      [new Attribute("NUMBER", "humidity")],
      null
    );

    this.capabilityMap["Sensor"] = new Capability(
      "Sensor",
      "capability.sensor",
      null,
      null
    );

    this.capabilityMap["SmokeDetector"] = new Capability(
      "SmokeDetector",
      "capability.smokeDetector",
      [new Attribute("ENUM", "smoke", ["clear", "detected", "tested"])],
      null
    );

    this.capabilityMap["SpeechSynthesis"] = new Capability(
      "SpeechSynthesis",
      "capability.speechSynthesis",
      null,
      [new Command("speak", [new CommandArgument("phrase", "STRING")])]
    );

    this.capabilityMap["Switch"] = new Capability(
      "Switch",
      "capability.switch",
      [new Attribute("ENUM", "switch", ["on", "off"])],
      [new Command("on"), new Command("off")]
    );

    this.capabilityMap["SwitchLevel"] = new Capability(
      "SwitchLevel",
      "capability.switchLevel",
      [new Attribute("NUMBER", "level")],
      [
        new Command("setLevel", [
          new CommandArgument("level", "NUMBER", true),
          new CommandArgument("duration", "NUMBER", false),
        ]),
      ]
    );

    this.capabilityMap["TemperatureMeasurement"] = new Capability(
      "TemperatureMeasurement",
      "capability.temperatureMeasurement",
      [new Attribute("NUMBER", "temperature")],
      null
    );

    this.capabilityMap["Valve"] = new Capability(
      "Valve",
      "capability.valve",
      [new Attribute("ENUM", "valve", ["open", "closed"])],
      [new Command("open"), new Command("close")]
    );

    this.capabilityMap["WaterSensor"] = new Capability(
      "WaterSensor",
      "capability.waterSensor",
      [new Attribute("ENUM", "water", ["dry", "wet"])],
      null
    );
  }

  public static getCapability(name: string): Capability {
    if (!name) {
      return null;
    }
    if (!this.capabilityMap) {
      this.createMap();
    }
    return this.capabilityMap[name.replace(/\s/g, "")];
  }

  public static initialize() {
    this.createMap();
  }
}
