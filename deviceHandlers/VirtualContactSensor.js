metadata(() => {
  definition(
    {
      name: "Virtual Contact Sensor",
      namespace: "parrotha.device.virtual",
      author: "parrot ha",
      deviceHandlerId: "2fc8d33b-67a0-4e67-b6db-c9ac062a70f0",
    },
    () => {
      capability("Contact Sensor");
      command("open");
      command("close");
    },
  );
});

function parse(description) {
  log.debug(`parse called with ${description}`);
}

function open() {
  log.debug("open!");
  sendEvent({ name: "contact", value: "open" });
}

function close() {
  sendEvent({ name: "contact", value: "closed" });
}
