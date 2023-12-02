export class WebServiceResponse {
  contentType: string = "application/json";
  status: number;
  data: string;

  constructor(properties: any) {
    if(properties == null)
     return;
    if(properties["content-type"] != null) {
      this.contentType = properties["content-type"];
    }
    if(properties["status"] != null) {
      this.status = properties["status"];
    }
    if(properties["data"] != null) {
      this.status = properties["data"];
    }
  }
}
