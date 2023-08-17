import { deleteWhitespace } from "./string-utils";

const HEX_HEADER = "0x";

export function numberArrayToHexString(numberArray: number[]): string {
  if (!numberArray) throw new Error("Value to convert must be defined.");

  let hexStr = numberArray
    .map((value) => parseInt(value.toString()).toString(16).padStart(2, "0"))
    .join("");
  return hexStr;
}

export function hexStringToNumberArray(hexString: string): number[] {
  if (hexString == null) throw new Error("Value to convert cannot be null.");

  hexString = deleteWhitespace(hexString);
  if (hexString.startsWith(HEX_HEADER))
    hexString = hexString.substring(HEX_HEADER.length);

  let len = hexString.length;
  if (len % 2 != 0) {
    hexString = "0" + hexString;
    len = hexString.length;
  }

  let data = new Array<number>(len / 2);

  for (let i = 0; i < len; i += 2) {
    data[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
  }
  return data;
}

export function numberToHexString(value: number, minBytes: number): string {
  if (value === null || typeof value === 'undefined' || minBytes === null || typeof minBytes === 'undefined') {
    throw new Error(
      "Value to convert and minimum number of bytes must be defined."
    );
  }
  if (minBytes <= 0) {
    throw new Error("Minimum number of bytes must be greater than 0.");
  }

  return parseInt(value.toString())
    .toString(16)
    .padStart(minBytes * 2, "0");
}
