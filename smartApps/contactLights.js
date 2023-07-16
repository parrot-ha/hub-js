// const smartAppId = "19c15ad0-f063-47db-852b-be54fb136e0e";

// const definition = {
//   name: "Contact Lights",
//   namespace: "com.parrotha",
//   author: "Parrot HA",
//   description: "Turn on and off lights based on contact sensors",
//   category: "",
//   iconUrl: "",
//   iconX2Url: "",
// };

definition({
  name: "Contact Lights",
  namespace: "com.parrotha",
  author: "Parrot HA",
  description: "Turn on and off lights based on contact sensors",
  category: "",
  iconUrl: "",
  iconX2Url: "",
  smartAppId: "19c15ad0-f063-47db-852b-be54fb136e0e",
});

function preferences() {
  page({ name: "mainPage", install: true, uninstall: true }, () => {
    section({ title: "Select switches to control" }, () => {
      input({
        name: "switches",
        type: "capability.switch",
        title: "Select switch",
        multiple: true,
      });
    });

    section({ title: "Select contact sensors to use" }, () => {
      input({
        name: "contacts",
        type: "capability.contactSensor",
        title: "Select contact sensors",
        multiple: true,
      });
    });
    section({ title: "Configure On/Off" }, () => {
      input({
        name: "onlyBetweenSunriseSunset",
        type: "boolean",
        title: "Only turn on lights between sunset and sunrise",
      });
      input({
        name: "onSunsetOffset",
        type: "number",
        title: "Number of minutes before or after sunset to turn on",
      });
      input({
        name: "onSunriseOffset",
        type: "number",
        title: "Number of minutes before or after sunrise to turn on",
      });
      input({
        name: "offTime",
        type: "number",
        title: "Number of minutes to keep on",
        defaultValue: 10,
      });
    });
  });
}

// preferences {
//     page(name: "mainPage", install: true, uninstall: true) {
//         section("Select switches to control") {
//             input "switches", "capability.switch", title: "Select switch", multiple: true
//         }
//         section("Select contact sensors to use") {
//             input "contacts", "capability.contactSensor", title: "Select contact sensors", multiple: true
//         }
//         section("Configure On/Off") {
//             input "onlyBetweenSunriseSunset", "boolean", title: "Only turn on lights between sunset and sunrise"
//             input "onSunsetOffset", "number", title: "Number of minutes before or after sunset to turn on"
//             input "onSunriseOffset", "number", title: "Number of minutes before or after sunrise to turn on"
//             input "offTime", "number", title: "Number of minutes to keep on", defaultValue: 10
//         }
//     }
// }

function installed() {
  log.debug("Installed");
  initialize();
}

function updated() {
  log.debug("Updated");
  log.debug(`offTime ${settings.offTime}`);
  log.debug(`offTime ${settings.offTime}`);
  log.debug(`onSunsetOffset ${settings.onSunsetOffset}`);
  unsubscribe();
  unschedule();
  initialize();
}

function initialize() {
  log.debug("initialize");
  subscribe(settings.contacts, "contact", contactSensorEvent);
  settings.contacts.forEach((contactSensor) => {
    log.debug(contactSensor.id);
    log.debug(contactSensor.name);
    contactSensor.open();
  });
}

function contactSensorEvent(evt) {
  log.debug(`contact sensor event! ${evt}`);

  let offsetSunriseAndSunset = getSunriseAndSunset({
    sunriseOffset: onSunriseOffset != null ? onSunriseOffset : 0,
    sunsetOffset: onSunsetOffset != null ? onSunsetOffset : 0,
  });

  sunrise = offsetSunriseAndSunset.sunrise.toLocalTime();
  sunset = offsetSunriseAndSunset.sunset.toLocalTime();
  currentTime = java.time.LocalTime.now();

  if (currentTime.isBefore(sunrise) || currentTime.isAfter(sunset)) {
    log.debug("we are at night");
    if (evt.value == "open") {
      if (!state.switchIdList) state.switchIdList = [];

      settings.switches.forEach((mySwitch) => {
        let currentValue = mySwitch.currentValue("switch");
        if (currentValue != "on") {
          // turn on for x minutes
          mySwitch.on();
          state.switchIdList.add(mySwitch.id);
        }
        log.debug("${mySwitch.id} current value ${currentValue}");
      });
      state.switchIdList = [...new Set(state.switchIdList)];
      // turn off lights in "offTime" minutes
      if (state.switchIdList && !openContacts) {
        runIn((offTime != null ? offTime : 10) * 60, "turnOffLights", {
          data: { switchIdList: state.switchIdList },
        });
      }
    } else if (evt.value == "closed") {
      let openContacts = false;
      settings.contacts.forEach((contactSensor) => {
        let currentValue = contactSensor.currentValue("contact");
        if (currentValue == "open") {
          openContacts = true;
        }
      });
      // reschedule lights to turn off in "offTime" minutes when a closed event happens
      if (state.switchIdList && !openContacts) {
        runIn((offTime != null ? offTime : 10) * 60, "turnOffLights", {
          data: { switchIdList: state.switchIdList },
        });
      }
    }
  } else {
    log.debug("we are in day");
  }
}

function turnOffLights(data) {
  log.debug(`data ${data}`);
  // check if contact is still open and do another runIn to check again in x minutes
  let openContacts = false;
  settings.contacts.forEach((contactSensor) => {
    let currentValue = contactSensor.currentValue("contact");
    if (currentValue == "open") {
      openContacts = true;
    }
  });

  if (openContacts) {
    runIn((offTime != null ? offTime : 10) * 60, "turnOffLights", {
      data: { switchIdList: state.switchIdList },
    });
  } else {
    settings.switches.forEach((mySwitch) => {
      if (state.switchIdList?.contains(mySwitch.id)) {
        mySwitch.off();
      }
    });
  }
  state.switchIdList = [];
}
