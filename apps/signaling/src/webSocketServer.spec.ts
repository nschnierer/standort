import * as http from "http";
import {
  client as WebSocketClient,
  connection as WebSocketConnection,
  Message as WebSocketMessage,
} from "websocket";
import { createWebSocketServer } from "./webSocketServer";

const SOCKET_PORT = 4000;
const SOCKET_URL = `ws://localhost:${SOCKET_PORT}`;
const SOCKET_API_KEY = "a5723s6d7d632ga1232";

const CLIENT_ID_1 =
  "1c099e92c27c64aa2f61d2c815edd222845041c7737259a76eca802a89f7c72a";
const CLIENT_ID_2 =
  "2c5920b9a195114d4b037ca08e693a63d7052914820a01bdc08651b3bcd0aafb";
const CLIENT_ID_3 =
  "3c5920b9a195114d4b037ca08e693a63d7052914820a01bdc08651b3bcd0aafc";

const closeConnection = (connection: WebSocketConnection) => {
  return new Promise<boolean>((resolve) => {
    connection.close();
    setTimeout(() => resolve(true), 300);
  });
};

describe("WebSocket Server", () => {
  let server: http.Server;

  beforeAll(async () => {
    // Start server and wait for it to start listening.
    server = http.createServer();
    createWebSocketServer(server, { apiKey: SOCKET_API_KEY });
    await new Promise((resolve) => {
      server.listen(SOCKET_PORT, () => resolve(true));
    });
  });

  it("should connect with the server", async () => {
    const client = new WebSocketClient();
    client.connect(
      `${SOCKET_URL}/?id=${CLIENT_ID_1}&apiKey=${SOCKET_API_KEY}`,
      "echo-protocol"
    );

    const connection = await new Promise<WebSocketConnection>((resolve) => {
      client.on("connect", (connection) => {
        resolve(connection);
      });
    });

    expect(connection.connected).toBeTruthy();
    closeConnection(connection);
  });

  it("should be possible to send and receive data", async () => {
    const client1 = new WebSocketClient();
    client1.connect(
      `${SOCKET_URL}/?id=${CLIENT_ID_1}&apiKey=${SOCKET_API_KEY}`,
      "echo-protocol"
    );

    const client2 = new WebSocketClient();
    client2.connect(
      `${SOCKET_URL}/?id=${CLIENT_ID_2}&apiKey=${SOCKET_API_KEY}`,
      "echo-protocol"
    );

    // Wait for both clients to connect.
    const [connection1, connection2] = await Promise.all([
      new Promise<WebSocketConnection>((resolve) => {
        client1.on("connect", (connection) => resolve(connection));
      }),
      new Promise<WebSocketConnection>((resolve) => {
        client2.on("connect", (connection) => resolve(connection));
      }),
    ]);

    let client1MessageCount = 0;
    let client2MessageCount = 0;

    // Wait for client 2 to receive the data.
    const client1Message = new Promise<string>((resolve) => {
      connection1.on("message", (message) => {
        const data = message.type === "utf8" ? message.utf8Data : "";
        client1MessageCount += 1;
        resolve(data);
      });
    });

    const client2Message = new Promise<string>((resolve) => {
      connection2.on("message", (message) => {
        const data = message.type === "utf8" ? message.utf8Data : "";
        client2MessageCount += 1;
        resolve(data);
      });
    });

    // Send data from client 1 to client 2.
    const dataFromClient1 = {
      from: CLIENT_ID_1,
      to: CLIENT_ID_2,
      data: "Hello!",
    };
    connection1.sendUTF(JSON.stringify(dataFromClient1));

    expect(JSON.parse(await client2Message)).toEqual(dataFromClient1);

    const dataFromClient2 = {
      from: CLIENT_ID_2,
      to: CLIENT_ID_1,
      data: "Hello!",
    };
    connection2.sendUTF(JSON.stringify(dataFromClient2));

    expect(JSON.parse(await client1Message)).toEqual(dataFromClient2);

    // Check how many times each client received messages.
    expect(client1MessageCount).toBe(1);
    expect(client2MessageCount).toBe(1);

    closeConnection(connection1);
    closeConnection(connection2);
  });

  it("should not be possible for a stranger to receive data", async () => {
    const client1 = new WebSocketClient();
    client1.connect(
      `${SOCKET_URL}/?id=${CLIENT_ID_1}&apiKey=${SOCKET_API_KEY}`,
      "echo-protocol"
    );

    // Client 2 will not receive any data.
    const client2 = new WebSocketClient();
    client2.connect(
      `${SOCKET_URL}/?id=${CLIENT_ID_2}&apiKey=${SOCKET_API_KEY}`,
      "echo-protocol"
    );

    const client3 = new WebSocketClient();
    client3.connect(
      `${SOCKET_URL}/?id=${CLIENT_ID_3}&apiKey=${SOCKET_API_KEY}`,
      "echo-protocol"
    );

    // Wait for clients to connect.
    const [connection1, connection2, connection3] = await Promise.all([
      new Promise<WebSocketConnection>((resolve) => {
        client1.on("connect", (connection) => resolve(connection));
      }),
      new Promise<WebSocketConnection>((resolve) => {
        client2.on("connect", (connection) => resolve(connection));
      }),
      new Promise<WebSocketConnection>((resolve) => {
        client3.on("connect", (connection) => resolve(connection));
      }),
    ]);

    let client1MessageCount = 0;
    let client2MessageCount = 0;
    let client3MessageCount = 0;

    // Wait for client 2 to receive the data.
    const client1Message = new Promise<boolean>((resolve) => {
      connection1.on("message", (message) => {
        if (message.type === "utf8") {
          client1MessageCount += 1;
        }
        resolve(true);
      });
    });
    const client2Message = new Promise<boolean>((resolve) => {
      connection2.on("message", (message) => {
        if (message.type === "utf8") {
          client2MessageCount += 1;
        }
        resolve(true);
      });
    });
    const client3Message = new Promise<boolean>((resolve) => {
      connection3.on("message", (message) => {
        if (message.type === "utf8") {
          client3MessageCount += 1;
        }
        resolve(true);
      });
    });

    // Send data from client 1 to client 2.
    connection1.sendUTF(
      JSON.stringify({
        from: CLIENT_ID_1,
        to: CLIENT_ID_3,
        data: "Ping",
      })
    );

    connection3.sendUTF(
      JSON.stringify({
        from: CLIENT_ID_3,
        to: CLIENT_ID_1,
        data: "Pong",
      })
    );

    connection1.sendUTF(
      JSON.stringify({
        from: CLIENT_ID_1,
        to: CLIENT_ID_2,
        data: "Ping",
      })
    );

    await Promise.all([client1Message, client2Message, client3Message]);

    // Check how many times each client received messages.
    expect(client1MessageCount).toBe(1);
    expect(client2MessageCount).toBe(1);
    expect(client3MessageCount).toBe(1);

    closeConnection(connection1);
    closeConnection(connection2);
    closeConnection(connection3);
  });

  it("should reject the connection with an invalid api key", async () => {
    const client = new WebSocketClient();
    client.connect(
      `${SOCKET_URL}/?id=${CLIENT_ID_1}&apiKey=WRONG`,
      "echo-protocol"
    );

    const result = await new Promise<Error>((resolve) => {
      client.on("connectFailed", (error) => {
        resolve(error);
      });
    });

    expect(result.toString()).toContain("Invalid API key");
  });

  it("should reject the connection with an invalid client id", async () => {
    const client = new WebSocketClient();
    client.connect(
      `${SOCKET_URL}/?id=1234456&apiKey=${SOCKET_API_KEY}`,
      "echo-protocol"
    );

    const result = await new Promise<Error>((resolve) => {
      client.on("connectFailed", (error) => {
        resolve(error);
      });
    });

    expect(result.toString()).toContain("Invalid client id");
  });

  afterAll(async () => {
    // Close the server.
    await new Promise((resolve) => {
      if (!server) {
        return resolve(true);
      }
      server.close(() => resolve(true));
    });
  });
});
