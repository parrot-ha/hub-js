metadata(() => {
  definition(
    {
      name: "ZigBee Outlet",
      namespace: "parrotha.device.zigbee.outlet",
      author: "parrot ha",
      deviceHandlerId: "2d09d652-0cef-4d06-9e07-f28db8dd4ea5",
    },
    () => {
      capability("Switch");
      capability("Outlet");
      capability("Refresh");
      capability("Configuration");

      fingerprint({
        profileId: "0104",
        inClusters: "0000,0003,0004,0005,0006,0B05,FC01,FC08",
        outClusters: "0003,0019",
        manufacturer: "LEDVANCE",
        model: "PLUG",
        deviceJoinName: "SYLVANIA Outlet",
      }); //SYLVANIA SMART+ Smart Plug
      fingerprint({
        profileId: "0104",
        inClusters: "0000,0003,0004,0005,0006,0702,0B04,0B05,FC03",
        outClusters: "0019",
        deviceJoinName: "Smartthings Outlet",
      });
    }
  );
});

function parse(description) {
  if (description.startsWith("catchall")) return;
  let descMap = zigbee.parseDescriptionAsMap(description);

  if (descMap.cluster == "0006" && descMap.attrId == "0000") {
    let value = descMap.value == "01" ? "on" : "off";
    sendEvent({ name: "switch", value: value });
  }
}

function on() {
  return zigbee.on();
}

function off() {
  return zigbee.off();
}

function refresh() {
  return [`ph raw 0x${device.deviceNetworkId} 1 0x01 0x0006 {10 00 00 00 00}`];
}

function configure() {
  return [
    `zdo bind 0x${device.deviceNetworkId} 0x01 0x01 0x0006 {${device.zigbeeId}} {}`,
    `delay 300`,
    `ph cr 0x${device.deviceNetworkId} 0x01 6 0 16 1 65534 {} {}`,
    `delay 300`,
  ];
}
