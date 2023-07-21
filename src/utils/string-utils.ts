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
