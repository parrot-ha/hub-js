// From: https://stackoverflow.com/questions/27030/comparing-arrays-of-objects-in-javascript/55256318#55256318
export function objectsEqual(o1: any, o2: any): boolean {
  if (o1 === null && o2 === null) return true;
  else if (o1 !== null && o2 !== null) {
    if (Array.isArray(o1) || Array.isArray(o2)) {
      return arraysEqual(o1, o2);
    } else {
      return typeof o1 === "object" && Object.keys(o1).length > 0
        ? Object.keys(o1).length === Object.keys(o2).length &&
            Object.keys(o1).every((p) => objectsEqual(o1[p], o2[p]))
        : o1 === o2;
    }
  } else {
    return false;
  }
}

// From: https://stackoverflow.com/questions/27030/comparing-arrays-of-objects-in-javascript/55256318#55256318
export function arraysEqual(a1: any, a2: any): boolean {
  return (
    (a1 == null && a2 == null) ||
    (a1 != null &&
      a2 != null &&
      a1.length === a2.length &&
      a1.every((o: any, idx: number) => objectsEqual(o, a2[idx])))
  );
}

export function difference(
  left: any,
  right: any
): {
  removed: string[];
  updated: any;
  added: any;
} {
  if (left == null) left = {};
  if (right == null) right = {};
  if (typeof left !== "object" || typeof right !== "object") {
    throw new Error("Cannot get difference of non-Object types");
  }
  let removed: string[] = [];
  let updated: any = {};
  let added: any = {};

  Object.keys(left).forEach((key) => {
    if (!right.hasOwnProperty(key)) {
      // right does not have the key, it was added
      added[key] = left[key];
    } else if (!objectsEqual(right[key], left[key])) {
      // the value changed, add it to the updated map
      updated[key] = left[key];
    }
  });
  Object.keys(right).forEach((key) => {
    if (!left.hasOwnProperty(key)) {
      // original does not have the key, it was removed
      removed.push(key);
    }
  });

  return { removed, updated, added };
}

/**
 * Returns undefined if object cannot be coverted
 *
 * @param obj An object to convert to a number
 */
export function toInteger(obj: any): number {
  if (!obj) return;
  let retVal = Number.parseInt(obj.toString());
  if (Number.isNaN(retVal)) return;
  else return retVal;
}
