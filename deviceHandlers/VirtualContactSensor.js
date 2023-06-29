const { Logger: log } = require("../services/logger-service");
const { sendEvent } = require("../services/device-helper");

const deviceHandlerId = '2fc8d33b-67a0-4e67-b6db-c9ac062a70f0';

const metadata = {
  definition: {
    name: "Virtual Contact Sensor",
    namespace: "parrotha.device.virtual",
    author: "parrot ha",
    capabilities: ["Contact Sensor"],
    commands: ["open", "close"],
  },
};

function parse(description) {
  log.debug(`parse called with ${description}`);
}

function open() {
  sendEvent({ name: "contact", value: "open" });
}

function close() {
  sendEvent({ name: "contact", value: "closed" });
}
