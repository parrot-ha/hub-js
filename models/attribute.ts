export class Attribute {
    dataType: string;
    name: string;
    possibleValues: string[];

    constructor(dataType:string, name: string, possibleValues: string[]= null) {
        this.dataType = dataType;
        this.name = name;
        this.possibleValues = possibleValues;
    }
}