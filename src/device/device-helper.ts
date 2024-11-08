import { isBlank, isEmpty, stringToObject } from "../utils/string-utils";

export function sendEvent(eventMap: any) {
  processEvent(eventMap);
}

export function parseLanMessage(stringToParse: string): any {
  if (stringToParse == null) {
    return null;
  }
  if (isBlank(stringToParse)) {
    return {};
  }
  let lanMessageMap: any = {};

  let lanMessageInterim = stringToObject(stringToParse, ",", ":");

  for (let key of Object.keys(lanMessageInterim)) {
    if (isEmpty(lanMessageInterim[key])) {
      lanMessageMap[key] = null;
    } else if ("headers" === key) {
      // base 64 decode the headers
      let header = atob(lanMessageInterim[key]);
      lanMessageMap["header"] = header;

      // TODO: is there a library we can use to do this?
      let headerMap = stringToObject(header, "\n", ":");
      lanMessageMap["headers"] = headerMap;
    } else if ("body" === key) {
      // base 64 decode the message
      lanMessageMap["body"] = atob(lanMessageInterim[key]);
    } else {
      lanMessageMap[key] = lanMessageInterim[key];
    }
  }
  return lanMessageMap;
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
