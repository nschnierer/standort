import http from "http";
import { server as WebSocketServer } from "websocket";
import type {
  connection as WebSocketConnection,
  request as WebSocketRequest,
  Message as WebSocketMessage,
} from "websocket";
import { ClientAddressZod, SocketMessageBaseZod } from "shared-types";
import { logger, isOriginAllowed } from "./utils";

// Store all connections in a map.
const connections = new Map<string, WebSocketConnection>();

/**
 * Extract and validate the client id and api key from the search params.
 */
const extractSearchParams = (search: string | null) => {
  const params = new URLSearchParams(search || "");

  // Parse and transform with zod.
  const addressParsed = ClientAddressZod.safeParse(params.get("id"));

  return {
    clientId: addressParsed.success ? addressParsed.data : "",
    apiKey: params.get("apiKey") || "",
  };
};

const onConnectionMessage = (message: WebSocketMessage) => {
  if (message.type !== "utf8") {
    return;
  }

  let data: JSON;
  try {
    data = JSON.parse(message.utf8Data);
  } catch (e) {
    // ignore invalid json
    return;
  }

  logger.info(`Received message: ${message.utf8Data.slice(0, 40)}...`);

  const parsed = SocketMessageBaseZod.safeParse(data);

  if (parsed.success === false) {
    logger.warn("Invalid message received");
    return;
  }

  if (parsed.data.to) {
    const toConnection = connections.get(parsed.data.to);
    if (toConnection) {
      logger.info(`Send message to ${parsed.data.to.slice(0, 8)}...`);
      toConnection.sendUTF(message.utf8Data);
    }
  }
};

const onConnectionClose =
  (clientId: string) => (reasonCode: number, description: string) => {
    logger.info(
      `🔴 Client with id ${clientId.slice(
        0,
        8
      )}*** disconnected.\nReason: ${description} (${reasonCode})`
    );
  };

/**
 * This function is called as callback by websocket.
 */
const onRequest = (serverApiKey: string) => (request: WebSocketRequest) => {
  if (!isOriginAllowed(request.origin)) {
    // IMPORTANT: Currently all origins are allowed.
    request.reject(403, "Origin not allowed");
    logger.warn(`Connection from origin ${request.origin} rejected.`);
    return;
  }

  // extract relevant parameters from the request
  const { clientId, apiKey } = extractSearchParams(request.resourceURL.search);

  if (serverApiKey && serverApiKey !== apiKey) {
    request.reject(403, "Invalid API key");
    logger.warn("Connection with invalid API key rejected.");
    return;
  }

  if (!clientId) {
    request.reject(400, "Invalid client id");
    logger.warn("Connection with invalid client id rejected.");
    return;
  }

  const connection: WebSocketConnection = request.accept(
    "echo-protocol",
    request.origin
  );

  connection.on("message", onConnectionMessage);
  connection.on("close", onConnectionClose(clientId));

  // Add connection to the list of connections
  connections.set(clientId, connection);

  logger.info(`🟢 Connection accepted with id ${clientId.slice(0, 8)}...`);
};

type WebSocketServerOptions = {
  apiKey?: string;
};

export const createWebSocketServer = (
  server: http.Server,
  options?: WebSocketServerOptions
) => {
  const { apiKey = "" } = options || {};

  const wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false,
  });

  wsServer.on("request", onRequest(apiKey));
  return wsServer;
};
