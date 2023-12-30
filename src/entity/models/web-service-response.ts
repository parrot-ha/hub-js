export class WebServiceResponse {
  contentType: string = "application/json";
  status: number = 200;
  data: string;

  constructor(properties: any) {
    if(properties == null)
     return;
    if(properties["contentType"] != null) {
      this.contentType = properties["contentType"];
    }
    if(properties["status"] != null) {
      this.status = properties["status"];
    }
    if(properties["data"] != null) {
      this.data = properties["data"];
    }
  }
}
