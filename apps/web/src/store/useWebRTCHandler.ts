import { reactive } from "vue";

const iceServers = [
  { urls: ["stun:stun.sipgate.net", "stun:stun.services.mozilla.com"] },
];

const SIGNALING_URL =
  import.meta.env.VITE_SIGNALING_URL || "ws://localhost:6000";
const SIGNALING_API_KEY = import.meta.env.VITE_SIGNALING_API_KEY || "";

console.log("Use signaling server:", SIGNALING_URL);

let socket: WebSocket;

const peers = reactive<{
  [id: string]: { connection: RTCPeerConnection; channel: RTCDataChannel };
}>({});

type DataChannelMessage = {
  text: string;
};

const messages = reactive<{ [from: string]: object[] }>({});

// The RTCSessionDescriptionInit already includes the type (answer or offer).
type SocketMessage<T = RTCSessionDescriptionInit | RTCIceCandidateInit> = {
  from: string;
  to: string;
  data: T;
};

const isSocketMessage = (message: object): message is SocketMessage => {
  return "from" in message && "to" in message && "data" in message;
};

const isSessionDescription = (
  message: SocketMessage<object>
): message is SocketMessage<RTCSessionDescriptionInit> => {
  return "sdp" in message.data;
};
const isIceCandidate = (
  message: SocketMessage<object>
): message is SocketMessage<RTCIceCandidateInit> => {
  return "candidate" in message.data;
};

let myIdentifier: string = "";

/**
 * Get or create a peer connection.
 * @param from identifier of the peer
 * @returns
 */
const getOrCreatePeer = (from: string) => {
  if (!peers[from]) {
    const connection = new RTCPeerConnection({ iceServers });
    const channel = connection.createDataChannel("data");
    peers[from] = { connection, channel };

    peers[from].connection.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }

      const iceCandidate: RTCIceCandidateInit = event.candidate.toJSON();

      if (iceCandidate.candidate?.length === 0) {
        return;
      }

      const message: SocketMessage<RTCIceCandidateInit> = {
        from: myIdentifier,
        to: from,
        data: iceCandidate,
      };
      socket?.send(JSON.stringify(message));
    };

    peers[from].connection.ondatachannel = (event) => {
      const remoteChannel = event.channel;
      remoteChannel.onmessage = (event) => {
        console.log("remoteChannel onmessage", event.data);
        // Add data to messages

        if (!messages[from]) {
          Object.assign(messages, { [from]: [] });
        }
        messages[from].push(JSON.parse(event.data));
      };
      remoteChannel.onclose = (event) => {
        console.log("remoteChannel onclose", event);
      };
    };

    peers[from].channel.onopen = () => {
      console.log("datachannel onopen");
    };
    peers[from].channel.onmessage = (event) => {
      console.log("datachannel onmessage", event);
    };
    peers[from].channel.onclose = (event) => {
      console.log("datachannel onclose", event);
    };
  }
  return peers[from];
};

const sendOffer = async (to: string) => {
  console.log("Send offer to", to);
  const { connection } = getOrCreatePeer(to);

  const offer = await connection.createOffer();
  connection.setLocalDescription(offer);

  const messageOffer: SocketMessage<RTCSessionDescriptionInit> = {
    from: myIdentifier,
    to,
    data: offer,
  };
  console.log(messageOffer);
  socket?.send(JSON.stringify(messageOffer));
};

const handleOffer = async (
  message: SocketMessage<RTCSessionDescriptionInit>
) => {
  console.log("Handle offer", message);

  const { connection } = getOrCreatePeer(message.from);
  connection.setRemoteDescription(new RTCSessionDescription(message.data));

  const answer = await connection.createAnswer();
  connection.setLocalDescription(answer);

  const answerMessage: SocketMessage<RTCSessionDescriptionInit> = {
    from: myIdentifier,
    to: message.from,
    data: answer,
  };
  socket?.send(JSON.stringify(answerMessage));
};

const handleAnswer = (message: SocketMessage<RTCSessionDescriptionInit>) => {
  console.log("Handle answer", message);

  const { connection } = getOrCreatePeer(message.from);
  connection.setRemoteDescription(new RTCSessionDescription(message.data));
};

const handleIceCandidate = (message: SocketMessage<RTCIceCandidateInit>) => {
  console.log("Handle ice candidate", message);

  const { connection } = getOrCreatePeer(message.from);
  connection.addIceCandidate(new RTCIceCandidate(message.data));
};

const sendData = (to: string, data: object) => {
  console.log("Send data", data);
  const { channel } = getOrCreatePeer(to);
  console.log(channel);
  channel.send(JSON.stringify({ ...data }));
};

const establishConnection = (myId: string) => {
  myIdentifier = myId;

  // Pass the API key as query parameter if available.
  // There is no way to pass the API key as HTTP header for WebSockets.
  const apiKeyParam = SIGNALING_API_KEY ? `&apiKey=${SIGNALING_API_KEY}` : "";

  // Build the URL for the signaling server with the client ID and API key.
  const webSocketUrlWithId = `${SIGNALING_URL}?id=${myId}${apiKeyParam}`;

  socket = new WebSocket(webSocketUrlWithId, "echo-protocol");

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

    // Check if message is valid
    if (message === null || !isSocketMessage(message)) {
      console.warn("Unknown socket message", message);
      return;
    }

    if (isSessionDescription(message)) {
      if (message.data.type === "offer") {
        handleOffer(message);
        return;
      }
      if (message.data.type === "answer") {
        handleAnswer(message);
        return;
      }
      console.warn(
        "Unable to handle session description with type:",
        message.data.type,
        message.data
      );
      return;
    }
    if (isIceCandidate(message)) {
      handleIceCandidate(message);
      return;
    }

    console.warn("Unable to handle socket message", message);
  };

  socket.onclose = () => {
    console.log("Socket closed. Reconnecting in 10 seconds...");
    setTimeout(() => {
      socket = new WebSocket(webSocketUrlWithId, "echo-protocol");
    }, 1000 * 10);
  };
};

export function useWebRTCHandler() {
  return { establishConnection, sendOffer, sendData, peers, messages };
}
