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
  url: string;
  apiKey?: string;
  protocol?: string;
  onValidMessage: (message: object) => void;
  /** For testing purposes */
  createSocketInstance?: typeof defaultWebSocketInstance;
}

/**
 * Creates a WebSocket connection to the signaling server.
 * @param options
 * @param options.url The URL of the signaling server.
 * @param options.apiKey The API key for the signaling server.
 * @param options.protocol Websocket protocol. Defaults to "echo-protocol".
 * @param options.onValidMessage A callback that is called when a message is received.
 * @param options.createSocketInstance A function that creates a WebSocket instance for testing purposes.
 * @returns
 */
export const createSignalingHandler = ({
  url,
  apiKey,
  protocol = "echo-protocol",
  onValidMessage,
  createSocketInstance = defaultWebSocketInstance,
}: CreateSocketHandlerOptions) => {
  let previousFingerprint = "";

  const onOpen = () => {
    console.log("Socket connected");
  };

  const onMessage = (event: MessageEvent) => {
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
      onValidMessage(parsed.data);
      return;
    }
    // Message is not valid
    return;
  };

  const onClose = (event: CloseEvent) => {
    console.log("Socket closed. Reconnecting in 10 seconds...");
    setTimeout(() => {
      connect(previousFingerprint);
    }, 1000 * 10);
  };

  let socket: WebSocket;

  const connect = (myFingerprint: string) => {
    previousFingerprint = myFingerprint;
    // Build the URL for the signaling server with the client ID and API key.
    const webSocketUrl = new URL(url);
    webSocketUrl.searchParams.append("id", myFingerprint);
    if (apiKey) {
      // There is no way to pass the API key as HTTP header for WebSockets.
      webSocketUrl.searchParams.append("apiKey", apiKey);
    }

    socket = createSocketInstance(webSocketUrl, protocol);
    socket.onopen = onOpen;
    socket.onmessage = onMessage;
    socket.onclose = onClose;
    return socket;
  };

  const sendMessage = (message: SocketMessageBase) => {
    socket.send(JSON.stringify(message));
  };

  const disconnect = () => {
    socket.onclose = () => {};
    socket.close();
  };

  return { connect, sendMessage, disconnect };
};
