import http from "node:http";
import { logger } from "./utils";
import { createWebSocketServer } from "./webSocketServer";

const PORT = parseInt(process.env.SIGNALING_PORT || "", 10) || 4000;
const API_KEY = process.env.SIGNALING_API_KEY || "";

const server = http.createServer((request, response) => {
  response.writeHead(404);
  response.end();
});

const wsServer = createWebSocketServer(server, { apiKey: API_KEY });

server.listen(PORT, () =>
  logger.info(`Started signaling server on port ${PORT}`)
);

process.on("SIGINT", () => {
  logger.info("Shutting down signaling server gracefully...");
  wsServer.shutDown();
  server.close(() => {
    process.exit();
  });
});
