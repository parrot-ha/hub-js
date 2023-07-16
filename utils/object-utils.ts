// From: https://stackoverflow.com/questions/27030/comparing-arrays-of-objects-in-javascript/55256318#55256318
export function objectsEqual(o1: any, o2: any): boolean {
  if (o1 === null && o2 === null) return true;
  else if (o1 !== null && o2 !== null) {
    return typeof o1 === "object" && Object.keys(o1).length > 0
      ? Object.keys(o1).length === Object.keys(o2).length &&
          Object.keys(o1).every((p) => objectsEqual(o1[p], o2[p]))
      : o1 === o2;
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
