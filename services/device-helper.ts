export function sendEvent(eventMap: any) {
  processEvent(eventMap);
}

export function parseLanMessage(message: string) {
  if (message == null) {
    return null;
  }
  if (message.trim().length === 0) {
    return {};
  }
  const lanMessageMap = {};
  const lanMessageInterim = {};
  message.split(",").forEach((item) => {
    item.split(":");
  });
  //TODO: handle message
  return null;
}

function processEvent(eventMap: any) {
  //if(eventMap == null || eventMap)
  // find subscribed smartapps to execute
  console.log(eventMap);
}

function stringToMap(
  stringToSplit: string,
  entrySeparator: string,
  keyValueSeparator: string
) {
  const map = new Map();
  const stringToSplitArray: string[] = stringToSplit.split(entrySeparator);
  stringToSplitArray.forEach((mapEntryString) => {
    if (mapEntryString.includes(keyValueSeparator)) {
      const mapEntryStringArray: string[] =
        mapEntryString.split(keyValueSeparator);
      if (mapEntryStringArray.length > 1) {
        if (
          mapEntryStringArray[1] == null ||
          mapEntryStringArray[1].trim().length === 0
        ) {
          map.set(mapEntryStringArray[0], null);
        } else {
          map.set(mapEntryStringArray[0].trim(), mapEntryStringArray[1].trim());
        }
      } else {
        map.set(mapEntryStringArray[0], null);
      }
    } else {
      map.set(mapEntryString.trim(), null);
    }
  });

  return map;
}
