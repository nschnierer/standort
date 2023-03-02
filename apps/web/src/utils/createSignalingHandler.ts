import { SocketMessageBase, SocketMessageBaseZod } from "shared-types";

/**
 * Creates a WebSocket instance.
 */
export const defaultWebSocketInstance = (
  ...params: ConstructorParameters<typeof WebSocket>
) => {
  return new WebSocket(...params);
};

interface CreateSocketHandlerOptions {
  myIdentifier: string;
  url: string;
  apiKey?: string;
  protocol?: string;
  onMessage: (message: object | null) => void;
  /** For testing purposes */
  createSocketInstance?: typeof defaultWebSocketInstance;
}

/**
 * Creates a WebSocket connection to the signaling server.
 * @param options
 * @param options.myIdentifier The identifier of the client.
 * @param options.url The URL of the signaling server.
 * @param options.apiKey The API key for the signaling server.
 * @param options.protocol Websocket protocol. Defaults to "echo-protocol".
 * @param options.onMessage A callback that is called when a message is received.
 * @param options.createSocketInstance A function that creates a WebSocket instance for testing purposes.
 * @returns
 */
export const createSignalingHandler = ({
  myIdentifier,
  url,
  apiKey,
  protocol = "echo-protocol",
  onMessage,
  createSocketInstance = defaultWebSocketInstance,
}: CreateSocketHandlerOptions) => {
  // Build the URL for the signaling server with the client ID and API key.
  const webSocketUrl = new URL(url);
  webSocketUrl.searchParams.append("id", myIdentifier);
  if (apiKey) {
    // There is no way to pass the API key as HTTP header for WebSockets.
    webSocketUrl.searchParams.append("apiKey", apiKey);
  }

  let socket: WebSocket = createSocketInstance(webSocketUrl, protocol);

  socket.onopen = (message) => {
    console.log("Socket connected");
  };

  // TODO: Ask signaling server for list of peers

  socket.onmessage = (event) => {
    // Parse message and catch errors
    let message: object | null = null;
    try {
      message = JSON.parse(event.data);
    } catch (error) {
      console.error("Unable to parse socket message");
      return;
    }
    // Parse and check if message is valid
    const parsed = SocketMessageBaseZod.safeParse(message);
    if (parsed.success) {
      onMessage(parsed.data);
      return;
    }
    // Message is not valid
    return;
  };

  const reconnect = () => {
    socket = createSocketInstance(webSocketUrl, protocol);
  };

  socket.onclose = () => {
    console.log("Socket closed. Reconnecting in 10 seconds...");
    setTimeout(() => {
      reconnect();
    }, 1000 * 10);
  };

  const sendMessage = (message: SocketMessageBase) => {
    socket.send(JSON.stringify(message));
  };

  const close = () => {
    socket.close();
  };

  return { reconnect, sendMessage, close };
};
