import WebSocket from "ws";
import { EntityService } from "../entity/entity-service";
import { ParrotEvent } from "../entity/models/event";

module.exports = function (
  server: any,
  entityService: EntityService
): WebSocket.Server {
  const websocketServer = new WebSocket.Server({
    noServer: true,
    clientTracking: true,
  });

  server.on("upgrade", (request: any, socket: any, head: any) => {
    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit("connection", websocket, request, null);
    });
  });

  websocketServer.on(
    "connection",
    function connection(socket: WebSocket, request: any, client: any) {
      const [_path, params] = request?.url?.split("?");
      let pathPattern = /\/api\/devices\/[0-9a-z-]*\/events/;
      if (!pathPattern.test(_path)) {
        socket.close();
        return;
      }
      let deviceId = _path.substring(
        "/api/devices/".length,
        _path.lastIndexOf("/events")
      );

      let deviceEventListener = function (event: ParrotEvent): void {
        if (
          event != null &&
          "DEVICE" == event.source &&
          event.sourceId === this.deviceId
        ) {
          // process event
          let eventMessage: string = JSON.stringify({
            name: event.name,
            value: event.value,
            unit: event.unit,
          });

          this.webSocket.send(eventMessage);
        }
      }.bind({ deviceId: deviceId, webSocket: socket });

      entityService.on("event", deviceEventListener);

      socket.on("message", (data: any, isBinary: boolean) => {
        console.log("message");
      });

      socket.on("close", function close() {
        console.log("disconnected");
        //dsel.unregisterWS();
        entityService.off("event", deviceEventListener);
      });
    }
  );

  return websocketServer;
};
