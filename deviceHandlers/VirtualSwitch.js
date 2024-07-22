metadata(() => {
  definition(
    {
      name: "Virtual Switch",
      namespace: "parrotha.device.virtual",
      author: "parrot ha",
      deviceHandlerId: "bacc991c-40a8-4d6f-a7ff-86223bfd97f7",
    },
    () => {
      capability("Switch");
    },
  );
});

function parse(description) {
  log.debug(`parse called with ${description}`);
}

function on() {
  log.debug("turning on");
  sendEvent({ name: "switch", value: "on" });
}

function off() {
  log.debug("turning off");
  sendEvent({ name: "switch", value: "off" });
}

function installed() {
  on();
}
