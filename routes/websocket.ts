import WebSocket from "ws";
import { DeviceSocketEventListener } from "../device/device-socket-event-listener";
import { EntityService } from "../services/entity-service";

module.exports = function (
  server: any,
  entityService: EntityService
): WebSocket.Server {
  const websocketServer = new WebSocket.Server({
    noServer: true,
    clientTracking: true,
  });

  server.on("upgrade", (request: any, socket: any, head: any) => {
    console.log("upgrade");
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
      let dsel: DeviceSocketEventListener = new DeviceSocketEventListener(
        deviceId,
        socket
      );
      entityService.registerEventListener(dsel);

      socket.on("message", (data: any, isBinary: boolean) => {
        console.log("message");
      });

      socket.on("close", function close() {
        console.log("disconnected");
        dsel.unregisterWS();
        entityService.unregisterEventListener(dsel);
      });
    }
  );

  return websocketServer;
};
