import { describe, expect, it, vi } from "vitest";
import * as MockSocket from "mock-socket";
import { createSignalingHandler } from "./createSignalingHandler";

// Use the mock socket instead of the real one.
const createSocketInstance = (
  ...params: ConstructorParameters<typeof WebSocket>
) => {
  return new MockSocket.WebSocket(...params);
};

describe("createSocketHandler", () => {
  it("should be defined", () => {
    expect(createSignalingHandler).toBeDefined();
  });

  it("should use the correct url", async () => {
    const fakeURL = "ws://localhost";
    const mockServer = new MockSocket.Server(fakeURL);

    const receivedMessage = new Promise<string>((resolve) => {
      mockServer.on("connection", (socket) => {
        resolve(socket.url);
      });
    });

    createSignalingHandler({
      myIdentifier: "d31af3",
      url: fakeURL,
      onMessage: () => {},
      createSocketInstance,
    });

    // Verify objects
    expect(await receivedMessage).toEqual("ws://localhost/?id=d31af3");
    mockServer.stop();
  });

  it("should use the correct url with api key", async () => {
    const fakeURL = "wss://signaling.standort.live";
    const mockServer = new MockSocket.Server(fakeURL);

    const receivedMessage = new Promise<string>((resolve) => {
      mockServer.on("connection", (socket) => {
        resolve(socket.url);
      });
    });

    createSignalingHandler({
      myIdentifier: "d31af3",
      url: fakeURL,
      apiKey: "123456",
      onMessage: () => {},
      createSocketInstance,
    });

    // Verify objects
    expect(await receivedMessage).toEqual(
      "wss://signaling.standort.live/?id=d31af3&apiKey=123456"
    );
    mockServer.stop();
  });

  it("should be possible to send a message", async () => {
    const fakeURL = "ws://localhost:8080";
    const mockServer = new MockSocket.Server(fakeURL);

    const receivedMessage = new Promise<any>((resolve) => {
      mockServer.on("connection", (socket) => {
        socket.on("message", (data) => {
          resolve(data);
        });
      });
    });

    const { sendMessage } = createSignalingHandler({
      myIdentifier: "test",
      url: fakeURL,
      onMessage: () => {},
      createSocketInstance,
    });

    const message = { from: "A", to: "V", data: { text: "From client" } };

    sendMessage(message);

    // Verify objects
    expect(await receivedMessage).toEqual(JSON.stringify(message));
    mockServer.stop();
  });

  it("should be possible to receive a message", async () => {
    const fakeURL = "ws://localhost:8080";
    const mockServer = new MockSocket.Server(fakeURL);

    const messageFromServer = {
      from: "ac96cfa3c229e489149d5ad15eee2e0aefb7cabdad5abfa4c76ab695f20ecd14",
      to: "bc96cfa3c229e489149d5ad15eee2e0aefb7cabdad5abfa4c76ab695f20ecd14",
      data: { text: "From client" },
    };

    const serverSentMessage = new Promise<boolean>((resolve) => {
      mockServer.on("connection", (socket) => {
        socket.send(JSON.stringify(messageFromServer));
        resolve(true);
      });
    });

    const onMessage = vi.fn();

    createSignalingHandler({
      myIdentifier: "test",
      url: fakeURL,
      onMessage,
      createSocketInstance,
    });

    expect(await serverSentMessage).toBeTruthy();

    // Verify objects
    expect(onMessage).toHaveBeenCalledWith(messageFromServer);
    mockServer.stop();
  });

  it("should ignore invalid messages", async () => {
    const fakeURL = "ws://localhost:8080";
    const mockServer = new MockSocket.Server(fakeURL);

    const messageFromServer = { anything: "irgendwas" };

    let counter = 0;
    const serverSentMessage = new Promise<boolean>((resolve) => {
      mockServer.on("connection", (socket) => {
        socket.send(JSON.stringify(messageFromServer));
        counter++;
        resolve(true);
      });
    });

    const onMessage = vi.fn();

    createSignalingHandler({
      myIdentifier: "1245367876534213",
      apiKey: "avbsadg",
      url: fakeURL,
      onMessage,
      createSocketInstance,
    });

    expect(await serverSentMessage).toBeTruthy();

    expect(counter).toBe(1);

    // Verify objects
    expect(onMessage).toHaveBeenCalledTimes(0);
    mockServer.stop();
  });

  it("should create a new connection on reconnect", async () => {
    const fakeURL = "ws://localhost:8080";
    const mockServer = new MockSocket.Server(fakeURL);

    const createInstance = vi.fn(createSocketInstance);

    const { reconnect } = createSignalingHandler({
      myIdentifier: "1245367876534213",
      url: fakeURL,
      onMessage: vi.fn(),
      createSocketInstance: createInstance,
    });

    expect(createInstance).toHaveBeenCalledTimes(1);

    reconnect();

    expect(createInstance).toHaveBeenCalledTimes(2);

    mockServer.stop();
  });
});
