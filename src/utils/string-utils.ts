export function deleteWhitespace(str: string): string {
  if (isEmpty(str)) {
    return str;
  } else {
    return str?.replace(/\s/g, "");
  }
}

export function isEmpty(str: string): boolean {
  return str == null || str.length == 0;
}

export function isNotEmpty(str: string): boolean {
  return !isEmpty(str);
}

export function isBlank(str: string): boolean {
  let strLen = length(str);
  if (strLen == 0) {
    return true;
  } else {
    return deleteWhitespace(str).length === 0;
  }
}

export function isNotBlank(str: string): boolean {
  return !isBlank(str);
}

export function length(str: string): number {
  return str == null ? 0 : str.length;
}

export function stringToObject( stringToSplit: string,  entrySeparator: string,  keyValueSeparator: string): any {
  let map: any = {};
  let stringToSplitArray: string[] = stringToSplit.split(entrySeparator);
  for (let mapEntryString of stringToSplitArray) {
      if (mapEntryString.indexOf(keyValueSeparator) > -1) {
          let mapEntryStringArray = mapEntryString.split(keyValueSeparator);
          if (mapEntryStringArray.length > 1) {
              if (isBlank(mapEntryStringArray[1])) {
                  map[mapEntryStringArray[0]] = null;
              } else {
                  map[mapEntryStringArray[0].trim()] = mapEntryStringArray[1].trim();
              }
          } else {
              map[mapEntryStringArray[0].trim()] = null;
          }
      } else {
          map[mapEntryString.trim()] = null;
      }
  }

  return map;
}