import {
  SocketMessage,
  SocketMessageICEZod,
  SocketMessageICE,
  SocketMessageSDPZod,
  SocketMessageSDP,
  FeatureCollectionZod,
  FeatureCollection,
  SocketMessageBase,
  SocketMessageDecryptedZod,
} from "shared-types";
import { EncryptedData } from "~/utils/cryptoHelpers";
/**
 * Creates a WebSocket instance.
 */
export const defaultWebSocket = (
  ...params: ConstructorParameters<typeof WebSocket>
) => {
  return new WebSocket(...params);
};

/**
 * Create PeerConnection instance.
 */
const defaultRTCPeerConnection = (
  ...params: ConstructorParameters<typeof RTCPeerConnection>
) => {
  return new RTCPeerConnection(...params);
};

/**
 * Create RTCSessionDescription instance.
 */
const defaultRTCSessionDescription = (
  ...params: ConstructorParameters<typeof RTCSessionDescription>
) => {
  return new RTCSessionDescription(...params);
};

/**
 * Create RTCIceCandidate instance.
 */
const defaultRTCIceCandidate = (
  ...params: ConstructorParameters<typeof RTCIceCandidate>
) => {
  return new RTCIceCandidate(...params);
};

export interface EnvelopeMeta {
  from: string;
  to: string;
}

export interface Envelope extends EnvelopeMeta {
  data: FeatureCollection;
}

interface Peer {
  connection: RTCPeerConnection;
  channel: RTCDataChannel;
}

interface WebRTCHandlerOptions {
  readonly socketUrl: string;
  readonly socketApiKey?: string;
  readonly socketProtocol?: string;
  readonly iceServers: RTCIceServer[];
}

export class WebRTCHandler {
  private startSequence: ReturnType<typeof this.startSequenceGenerator> | null =
    null;
  private myFingerprint: string = "";
  private socket: WebSocket | null = null;
  private readonly peers: Map<string, Peer> = new Map();
  private onDataChannelMessage: (
    from: string,
    message: FeatureCollection
  ) => void = () => {};

  // Register encrypt and decrypt functions:
  private encryptMessage?: (
    to: string,
    message: string
  ) => Promise<EncryptedData>;
  private decryptMessage?: (
    to: string,
    message: EncryptedData
  ) => Promise<string>;

  constructor(
    private readonly options: WebRTCHandlerOptions,
    // Allow dependency injection for testing purposes:
    private readonly createWebSocket = defaultWebSocket,
    private readonly createRTCPeerConnection = defaultRTCPeerConnection,
    private readonly createRTCSessionDescription = defaultRTCSessionDescription,
    private readonly createRTCIceCandidate = defaultRTCIceCandidate
  ) {
    console.log("WebRTCHandler created");
  }

  private *startSequenceGenerator(
    myFingerprint: string,
    contactFingerprints: string[]
  ) {
    this.establishSignaling(myFingerprint);
    yield "socket_wait";
    this.restorePeerConnections(contactFingerprints);
  }

  public start(myFingerprint: string, contactFingerprints: string[]) {
    this.startSequence = this.startSequenceGenerator(
      myFingerprint,
      contactFingerprints
    );
    this.startSequence.next();
  }

  public disconnectPeers() {
    this.peers.forEach((peer) => {
      peer.connection.close();
    });
    this.peers.clear();
  }

  private restorePeerConnections(contactFingerprints: string[]) {
    contactFingerprints.forEach((fingerprint) => {
      this.sendOffer(fingerprint);
    });
  }

  public getMyCurrentFingerprint() {
    return this.myFingerprint;
  }

  private establishSignaling(myFingerprint: string) {
    this.myFingerprint = myFingerprint;
    const {
      socketUrl,
      socketApiKey,
      socketProtocol = "echo-protocol",
    } = this.options;

    // Build the URL for the signaling server with the client ID and API key.
    const socketUrlWithParams = new URL(socketUrl);
    socketUrlWithParams.searchParams.append("id", myFingerprint);
    if (socketApiKey) {
      // There is no way to pass the API key as HTTP header for WebSockets.
      socketUrlWithParams.searchParams.append("apiKey", socketApiKey);
    }

    this.socket = this.createWebSocket(
      socketUrlWithParams.toString(),
      socketProtocol
    );
    this.socket.onopen = () => {
      this.startSequence?.next();
      console.log("Socket connected");
    };
    this.socket.onmessage = this.onSignalingMessage.bind(this);
    this.socket.onclose = (event: CloseEvent) => {
      console.log("Socket closed. Reconnecting in 10 seconds...");
      setTimeout(() => {
        this.establishSignaling(this.myFingerprint);
      }, 5000);
    };
  }

  public terminateSignaling() {
    if (!this.socket) {
      return;
    }
    this.socket.onopen = () => {};
    this.socket.onmessage = () => {};
    this.socket.onclose = () => {};
    this.socket.close();
  }

  private async onSignalingMessage(messageRaw: MessageEvent) {
    let message: SocketMessageBase;
    try {
      message = JSON.parse(messageRaw.data);
    } catch (error) {
      console.error("Unable to parse socket message as JSON", error);
      return;
    }

    let data = message.data;

    // Handle encrypted messages
    const parsedEncrypted = SocketMessageDecryptedZod.safeParse(message);
    if (parsedEncrypted.success) {
      if (!this.decryptMessage) {
        console.error(
          "Received encrypted message but no decryptMessage registered."
        );
        return;
      }
      const rawData = await this.decryptMessage(
        message.from,
        parsedEncrypted.data.data
      );
      try {
        data = JSON.parse(rawData);
      } catch (error) {
        console.error(
          "Unable to parse decrypted socket message as JSON",
          error
        );
        return;
      }
    }

    // For the following checks we use the Zod schema
    // to securely validate and parse incoming messages.

    const parsedSDP = SocketMessageSDPZod.safeParse({ ...message, data });
    if (parsedSDP.success) {
      const { type } = parsedSDP.data.data;
      switch (type) {
        case "offer":
          this.handleOffer(parsedSDP.data);
          return;
        case "answer":
          this.handleAnswer(parsedSDP.data);
          return;
      }
    }

    const parsedIce = SocketMessageICEZod.safeParse({ ...message, data });
    if (parsedIce.success) {
      this.handleIceCandidate(parsedIce.data);
      return;
    }

    console.warn("Unknown signaling message", message);
  }

  private async sendSignalingMessage(message: SocketMessage) {
    if (this.encryptMessage) {
      const data = await this.encryptMessage(
        message.to,
        JSON.stringify(message.data)
      );
      this.socket?.send(JSON.stringify({ ...message, data }));
      return;
    }
    this.socket?.send(JSON.stringify(message));
  }

  /**
   * Get or create a peer connection.
   * @param peerFingerprint Fingerprint of the peer
   * @returns Peer connection and data channel
   */
  private getOrCreatePeer(to: string) {
    if (this.peers.has(to)) {
      // Return existing peer
      return this.peers.get(to)!;
    }

    const { iceServers } = this.options;

    // Create a peer with a new connection and channel
    const connection = this.createRTCPeerConnection({ iceServers });
    const channel = connection.createDataChannel("data");
    const peer = { connection, channel };

    peer.connection.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }
      const iceCandidate: RTCIceCandidateInit = event.candidate.toJSON();
      const message: SocketMessageICE = {
        from: this.myFingerprint,
        to,
        data: iceCandidate,
      };
      this.sendSignalingMessage(message);
    };

    peer.connection.ondatachannel = (event) => {
      const remoteChannel = event.channel;
      remoteChannel.onmessage = (event) => {
        console.log("remoteChannel onmessage", event.data);

        try {
          const object = JSON.parse(event.data);
          const data = FeatureCollectionZod.parse(object);
          this.onDataChannelMessage(to, data);
        } catch (error) {
          console.error("Unable to parse message", error);
        }
      };
      remoteChannel.onclose = (event) => {
        console.log("remoteChannel onclose", event);
      };
    };

    peer.channel.onopen = () => {
      console.log("datachannel onopen");
    };
    peer.channel.onmessage = (event) => {
      console.log("datachannel onmessage", event);
    };
    peer.channel.onclose = (event) => {
      this.peers.delete(to);
      console.log("datachannel onclose", event);
    };

    // Add peer to map and return it
    this.peers.set(to, peer);
    return peer;
  }

  /**
   * Send offer to a peer.
   * @param to Identifier of the peer
   */
  public async sendOffer(to: string) {
    if (to === this.myFingerprint) {
      return;
    }

    console.log("Send offer to", to);
    const { connection } = this.getOrCreatePeer(to);

    const offer = await connection.createOffer();
    connection.setLocalDescription(offer);

    const messageOffer: SocketMessageSDP = {
      from: this.myFingerprint,
      to,
      data: offer,
    };
    console.log(messageOffer);
    this.sendSignalingMessage(messageOffer);
  }

  /**
   * Handle an answer from a peer.
   * @param message
   */
  private async handleOffer(message: SocketMessageSDP) {
    console.log("Handle offer", message);

    const { connection } = this.getOrCreatePeer(message.from);

    connection.setRemoteDescription(
      this.createRTCSessionDescription(message.data)
    );

    const answer = await connection.createAnswer();
    connection.setLocalDescription(answer);

    const answerMessage: SocketMessageSDP = {
      from: this.myFingerprint,
      to: message.from,
      data: answer,
    };
    this.sendSignalingMessage(answerMessage);
  }

  private handleAnswer(message: SocketMessageSDP) {
    console.log("Handle answer", message);

    const { connection } = this.getOrCreatePeer(message.from);
    connection.setRemoteDescription(
      this.createRTCSessionDescription(message.data)
    );
  }

  private handleIceCandidate(message: SocketMessageICE) {
    console.log("Handle ice candidate", message);

    const { connection } = this.getOrCreatePeer(message.from);
    connection.addIceCandidate(this.createRTCIceCandidate(message.data));
  }

  public sendMessage(to: string, message: FeatureCollection) {
    const { channel } = this.getOrCreatePeer(to);
    channel.send(JSON.stringify(message));
  }

  public onMessage(
    callback: (from: string, message: FeatureCollection) => void
  ) {
    this.onDataChannelMessage = callback;
  }

  public registerEncryptMessage(func: typeof this.encryptMessage) {
    this.encryptMessage = func;
  }
  public registerDecryptMessage(func: typeof this.decryptMessage) {
    this.decryptMessage = func;
  }
}
