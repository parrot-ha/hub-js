import { numberToHexString, reverseHexString } from "./hex-utils";

export class DataType {
  public static readonly NO_DATA = 0x00; //No Data
  public static readonly DATA8 = 0x08; //8-bit data
  public static readonly DATA16 = 0x09; //16-bit data
  public static readonly DATA24 = 0x0a; //24-bit data
  public static readonly DATA32 = 0x0b; //32-bit data
  public static readonly DATA40 = 0x0c; //40-bit data
  public static readonly DATA48 = 0x0d; //48-bit data
  public static readonly DATA56 = 0x0e; //56-bit data
  public static readonly DATA64 = 0x0f; //64-bit data
  public static readonly BOOLEAN = 0x10; //Boolean
  public static readonly BITMAP8 = 0x18; //8-bit bitmap
  public static readonly BITMAP16 = 0x19; //16-bit bitmap
  public static readonly BITMAP24 = 0x1a; //24-bit bitmap
  public static readonly BITMAP32 = 0x1b; //32-bit bitmap
  public static readonly BITMAP40 = 0x1c; //40-bit bitmap
  public static readonly BITMAP48 = 0x1d; //48-bit bitmap
  public static readonly BITMAP56 = 0x1e; //56-bit bitmap
  public static readonly BITMAP64 = 0x1f; //64-bit bitmap
  public static readonly UINT8 = 0x20; //Unsigned 8-bit int
  public static readonly UINT16 = 0x21; //Unsigned 16-bit int
  public static readonly UINT24 = 0x22; //Unsigned 24-bit int
  public static readonly UINT32 = 0x23; //Unsigned 32-bit int
  public static readonly UINT40 = 0x24; //Unsigned 40-bit int
  public static readonly UINT48 = 0x25; //Unsigned 48-bit int
  public static readonly UINT56 = 0x26; //Unsigned 56-bit int
  public static readonly UINT64 = 0x27; //Unsigned 64-bit int
  public static readonly INT8 = 0x28; //Signed 8-bit int
  public static readonly INT16 = 0x29; //Signed 16-bit int
  public static readonly INT24 = 0x2a; //Signed 24-bit int
  public static readonly INT32 = 0x2b; //Signed 32-bit int
  public static readonly INT40 = 0x2c; //Signed 40-bit int
  public static readonly INT48 = 0x2d; //Signed 48-bit int
  public static readonly INT56 = 0x2e; //Signed 56-bit int
  public static readonly INT64 = 0x2f; //Signed 64-bit int
  public static readonly ENUM8 = 0x30; //8-bit enumeration
  public static readonly ENUM16 = 0x31; //16-bit enumeration
  public static readonly FLOAT2 = 0x38; //Semi-precision
  public static readonly FLOAT4 = 0x39; //Single precision
  public static readonly FLOAT8 = 0x3a; //Double precision
  public static readonly STRING_OCTET = 0x41; //Octet String
  public static readonly STRING_CHAR = 0x42; //Character String
  public static readonly STRING_LONG_OCTET = 0x43; //Long Octet String
  public static readonly STRING_LONG_CHAR = 0x44; //Long Character String
  public static readonly ARRAY = 0x48; //Array
  public static readonly STRUCTURE = 0x4c; //Structure
  public static readonly SET = 0x50; //Set
  public static readonly BAG = 0x51; //Bag
  public static readonly TIME_OF_DAY = 0xe0; //Time of day
  public static readonly DATE = 0xe1; //Date
  public static readonly UTCTIME = 0xe2; //UTCTime
  public static readonly CLUSTER_ID = 0xe8; //Cluster ID
  public static readonly ATTRIBUTE_ID = 0xe9; //Attribute ID
  public static readonly BACNET_OID = 0xea; //BACnet OID
  public static readonly IEEE_ADDRESS = 0xf0; //IEEE address
  public static readonly SECKEY128 = 0xf1; //128-bit security key
  public static readonly UNKNOWN = 0xff; //Unknown

  public static pack(
    data: number,
    type: number,
    littleEndian: boolean = true
  ): string {
    let hexString = numberToHexString(data, this.getLength(type));
    if (hexString.length > this.getLength(type) * 2)
      throw new Error("Data too large for data type");
    if (littleEndian) return reverseHexString(hexString);
    else return hexString;
  }

  public static getLength(type: number): number {
    switch (type) {
      case this.NO_DATA:
      case this.UNKNOWN:
        return 0;
      case this.DATA8:
      case this.BOOLEAN:
      case this.BITMAP8:
      case this.UINT8:
      case this.INT8:
      case this.ENUM8:
      case this.FLOAT8:
        return 1;
      case this.DATA16:
      case this.BITMAP16:
      case this.UINT16:
      case this.INT16:
      case this.ENUM16:
      case this.FLOAT2:
      case this.CLUSTER_ID:
      case this.ATTRIBUTE_ID:
        return 2;
      case this.DATA24:
      case this.BITMAP24:
      case this.UINT24:
      case this.INT24:
        return 3;
      case this.DATA32:
      case this.BITMAP32:
      case this.UINT32:
      case this.INT32:
      case this.FLOAT4:
      case this.TIME_OF_DAY:
      case this.DATE:
      case this.UTCTIME:
      case this.BACNET_OID:
        return 4;
      case this.DATA40:
      case this.BITMAP40:
      case this.UINT40:
      case this.INT40:
        return 5;
      case this.DATA48:
      case this.BITMAP48:
      case this.UINT48:
      case this.INT48:
        return 6;
      case this.DATA56:
      case this.BITMAP56:
      case this.UINT56:
      case this.INT56:
        return 7;
      case this.DATA64:
      case this.BITMAP64:
      case this.UINT64:
      case this.INT64:
      case this.IEEE_ADDRESS:
        return 8;
      case this.SECKEY128:
        return 16;
      case this.STRING_OCTET:
      case this.STRING_CHAR:
      case this.STRING_LONG_OCTET:
      case this.STRING_LONG_CHAR:
      case this.ARRAY:
      case this.STRUCTURE:
      case this.SET:
      case this.BAG:
        return -1;
    }
    return 0;
  }
}
