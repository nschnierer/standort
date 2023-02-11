import express from "express";
import { server as WebSocketServer } from "websocket";
import type { connection as WebSocketConnection } from "websocket";

const SERVER_PORT = parseInt(process.env.SIGNALING_SERVER_PORT, 10) || 6000;

const app = express();

const server = app.listen(SERVER_PORT, () =>
  console.log("Started signaling server on port", SERVER_PORT)
);

const wsServer = new WebSocketServer({
  httpServer: server,
  autoAcceptConnections: false,
});

// Store all connections in a map.
const connections = new Map<string, WebSocketConnection>();

/**
 * Check if the origin is allowed to connect.
 */
function isOriginAllowed(origin: string) {
  console.log("origin", origin);
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

/**
 * Check if a client id is a valid fingerprint.
 */
function isClientIdValid(clientId: string) {
  return /^[a-fA-F0-9]{64}$/.test(clientId);
}

wsServer.on("request", function (request) {
  const rawClientId =
    typeof request.resourceURL.query === "object" &&
    typeof request.resourceURL.query.id === "string"
      ? request.resourceURL.query.id
      : "";

  if (!isOriginAllowed(request.origin)) {
    request.reject();
    console.log(
      new Date().toISOString(),
      `Connection from origin ${request.origin} rejected.`
    );
    return;
  }
  if (!isClientIdValid(rawClientId)) {
    request.reject();
    console.log(
      new Date().toISOString(),
      "Connection with invalid client id rejected."
    );
    return;
  }

  const connection: WebSocketConnection = request.accept(
    "echo-protocol",
    request.origin
  );

  // To lower case to avoid case sensitivity
  const clientId = rawClientId.toLowerCase();
  // Add connection to the list of connections
  connections.set(clientId, connection);

  console.log(
    new Date().toISOString(),
    `🟢 Connection accepted with id ${clientId.slice(0, 8)}...`
  );

  connection.on("message", function (message) {
    if (message.type !== "utf8") {
      return;
    }
    console.log(
      new Date().toISOString(),
      `Received message: ${message.utf8Data.slice(0, 60)}...`
    );

    let toClientId = "";
    try {
      const { to } = JSON.parse(message.utf8Data);
      toClientId = to;
    } catch (error) {
      // ignore invalid JSON
    }

    if (toClientId) {
      const toConnection = connections.get(toClientId);
      if (toConnection) {
        console.log(
          new Date().toISOString(),
          `Send message to ${toClientId.slice(0, 8)}...`
        );
        toConnection.sendUTF(message.utf8Data);
      }
    }
  });

  connection.on("close", function (reasonCode, description) {
    console.log(
      new Date().toISOString(),
      `🔴 Client with id ${clientId.slice(0, 8)}... disconnected.`
    );
  });
});
