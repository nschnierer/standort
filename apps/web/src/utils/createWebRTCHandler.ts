import {
  SocketMessage,
  SocketMessageICE,
  SocketMessageSDP,
  FeatureCollectionZod,
  FeatureCollection,
} from "shared-types";

const defaultPeerConnectionInstance = (
  ...params: ConstructorParameters<typeof RTCPeerConnection>
) => {
  return new RTCPeerConnection(...params);
};

export interface EnvelopeMeta {
  from: string;
  to: string;
}

export interface Envelope extends EnvelopeMeta {
  data: FeatureCollection;
}

interface CreateWebRTCHandlerOptions {
  iceServers?: RTCConfiguration["iceServers"];
  onSignalingMessage: (message: SocketMessage) => void;
  onMessage: (envelope: Envelope) => void;
  /** For testing purposes */
  createPeerConnectionInstance?: typeof defaultPeerConnectionInstance;
}

export function createWebRTCHandler({
  iceServers,
  onSignalingMessage,
  onMessage,
  createPeerConnectionInstance = defaultPeerConnectionInstance,
}: CreateWebRTCHandlerOptions) {
  // Open peer connections
  const peers = new Map<
    string,
    { connection: RTCPeerConnection; channel: RTCDataChannel }
  >();

  /**
   * Get or create a peer connection.
   * @param peerFingerprint Fingerprint of the peer
   * @returns Peer connection and data channel
   */
  const getOrCreatePeer = (envelopeMeta: EnvelopeMeta) => {
    if (peers.has(envelopeMeta.to)) {
      // Return existing peer
      return peers.get(envelopeMeta.to)!;
    }

    // Create a peer with a new connection and channel
    const connection = createPeerConnectionInstance({ iceServers });
    const channel = connection.createDataChannel("data");
    const peer = { connection, channel };

    peer.connection.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }
      const iceCandidate: RTCIceCandidateInit = event.candidate.toJSON();

      if (iceCandidate.candidate?.length === 0) {
        return;
      }
      const message: SocketMessageICE = {
        ...envelopeMeta,
        data: iceCandidate,
      };
      onSignalingMessage(message);
    };

    peer.connection.ondatachannel = (event) => {
      const remoteChannel = event.channel;
      remoteChannel.onmessage = (event) => {
        console.log("remoteChannel onmessage", event.data);

        try {
          const object = JSON.parse(event.data);
          const data = FeatureCollectionZod.parse(object);
          onMessage({ ...envelopeMeta, data });
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
      console.log("datachannel onclose", event);
    };

    // Add peer to map and return it
    peers.set(envelopeMeta.to, peer);
    return peer;
  };

  /**
   * Send offer to a peer.
   * @param to Identifier of the peer
   */
  const sendOffer = async (envelopeMeta: EnvelopeMeta) => {
    console.log("Send offer to", envelopeMeta.to);
    const { connection } = getOrCreatePeer(envelopeMeta);

    const offer = await connection.createOffer();
    connection.setLocalDescription(offer);

    const messageOffer: SocketMessageSDP = {
      ...envelopeMeta,
      data: offer,
    };
    console.log(messageOffer);
    onSignalingMessage(messageOffer);
  };

  /**
   * Handle an answer from a peer.
   * @param message
   */
  const handleOffer = async (message: SocketMessageSDP) => {
    console.log("Handle offer", message);

    const envelopeMeta: EnvelopeMeta = {
      from: message.to,
      to: message.from,
    };

    const { connection } = getOrCreatePeer(envelopeMeta);

    connection.setRemoteDescription(new RTCSessionDescription(message.data));

    const answer = await connection.createAnswer();
    connection.setLocalDescription(answer);

    const answerMessage: SocketMessageSDP = {
      ...envelopeMeta,
      data: answer,
    };
    onSignalingMessage(answerMessage);
  };

  const handleAnswer = (message: SocketMessageSDP) => {
    console.log("Handle answer", message);

    const { connection } = getOrCreatePeer({
      from: message.to,
      to: message.from,
    });
    connection.setRemoteDescription(new RTCSessionDescription(message.data));
  };

  const handleIceCandidate = (message: SocketMessageICE) => {
    console.log("Handle ice candidate", message);

    const { connection } = getOrCreatePeer({
      from: message.to,
      to: message.from,
    });
    connection.addIceCandidate(new RTCIceCandidate(message.data));
  };

  const sendData = ({ data, ...envelopeMeta }: Envelope) => {
    console.log("Send data", data);
    const { channel } = getOrCreatePeer(envelopeMeta);
    console.log(channel);
    channel.send(JSON.stringify({ ...data }));
  };

  return { sendOffer, handleOffer, handleAnswer, handleIceCandidate, sendData };
}
