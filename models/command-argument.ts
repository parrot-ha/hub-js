export class CommandArgument {
    name: string;
    required: boolean;
    dataType: string;

    constructor(name: string, dataType: string, required: boolean = true) {
        this.name = name;
        this.dataType = dataType;
        this.required = required;
    }
}