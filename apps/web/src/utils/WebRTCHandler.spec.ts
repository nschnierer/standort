import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as MockSocket from "mock-socket";
import { WebRTCHandler } from "./WebRTCHandler";

const FINGERPRINT_A =
  "ac96cfa3c229e489149d5ad15eee2e0aefb7cabdad5abfa4c76ab695f20ecd14";
const FINGERPRINT_B =
  "bc96cfa3c229e489149d5ad15eee2e0aefb7cabdad5abfa4c76ab695f20ecd14";

const sdpMockOffer = {
  sdp: "mock",
  type: "offer",
} as RTCSessionDescriptionInit;

const sdpMockAnswer = {
  sdp: "mock",
  type: "answer",
} as RTCSessionDescriptionInit;

const iceCandidateMock = {
  candidate: "candidate:1 1 UDP 2013266431",
} as RTCIceCandidateInit;

const mockDataChannel = {
  onopen: (ev: Event) => null,
} as RTCDataChannel;

const createOffer = (options?: RTCOfferOptions) =>
  Promise.resolve(sdpMockOffer);

const addIceCandidate = (candidate?: RTCIceCandidateInit) => Promise.resolve();

const mockPeerConnection = {
  createDataChannel: (label: string, dataChannelDict?: RTCDataChannelInit) =>
    mockDataChannel,
  setLocalDescription: (description?: RTCLocalSessionDescriptionInit) =>
    Promise.resolve(),
  setRemoteDescription: (description: RTCSessionDescriptionInit) =>
    Promise.resolve(),
  createOffer,
  createAnswer: () => Promise.resolve(sdpMockAnswer),
  addIceCandidate,
  // onicecandidate: null,
  // ondatachannel: null,
} as RTCPeerConnection;

const mockPeerConnectionInstance = vi.fn(() => mockPeerConnection);

const mockRTCSessionDescription = vi.fn(
  (descriptionInitDict: RTCSessionDescriptionInit) => {
    return descriptionInitDict as RTCSessionDescription;
  }
);

const mockRTCIceCandidate = vi.fn((candidateInitDict?: RTCIceCandidateInit) => {
  return candidateInitDict as RTCIceCandidate;
});

// Use the mock socket instead of the real one.
const createSocketInstance = vi.fn(
  (...params: ConstructorParameters<typeof WebSocket>) => {
    return new MockSocket.WebSocket(...params);
  }
);

const iceServers = [
  {
    urls: "stun:stun.test.net",
  },
];

const socketUrl = "ws://localhost";
const socketApiKey = "123456";
let socketServer: MockSocket.Server;

describe("WebRTCHandler", () => {
  beforeEach(() => {
    socketServer = new MockSocket.Server(socketUrl);
  });

  afterEach(() => {
    vi.clearAllMocks();
    socketServer.stop();
  });

  it("should be defined", () => {
    expect(WebRTCHandler).toBeDefined();
  });

  it("should connect with signaling server correctly", async () => {
    const onSocketClient = new Promise<MockSocket.Client>((resolve) => {
      socketServer.on("connection", (socket) => {
        resolve(socket);
      });
    });

    const handler = new WebRTCHandler(
      {
        socketUrl,
        socketApiKey,
        iceServers,
      },
      createSocketInstance
    );
    handler.start(FINGERPRINT_A, []);

    const socketClient = await onSocketClient;

    expect(socketClient).toBeDefined();
    expect(createSocketInstance).toHaveBeenCalledTimes(1);

    expect(createSocketInstance).toHaveBeenCalledWith(
      `${socketUrl}/?id=${FINGERPRINT_A}&apiKey=${socketApiKey}`,
      "echo-protocol"
    );
  });

  it("should create and send an offer", async () => {
    const onSocketMessage = new Promise<string>((resolve) => {
      socketServer.on("connection", (socket) => {
        socket.on("message", (data) => {
          resolve(data as string);
        });
      });
    });

    const spyCreateDataChannel = vi.spyOn(
      mockPeerConnection,
      "createDataChannel"
    );
    const spyCreateOffer = vi.spyOn(mockPeerConnection, "createOffer");
    const spySetLocalDescription = vi.spyOn(
      mockPeerConnection,
      "setLocalDescription"
    );

    const handler = new WebRTCHandler(
      {
        socketUrl,
        socketApiKey,
        iceServers,
      },
      createSocketInstance,
      mockPeerConnectionInstance
    );
    handler.start(FINGERPRINT_A, []);
    handler.sendOffer(FINGERPRINT_B);

    const socketMessage = await onSocketMessage;

    expect(mockPeerConnectionInstance).toHaveBeenCalledWith({ iceServers });
    expect(spyCreateDataChannel).toHaveBeenCalledWith("data");
    expect(spyCreateOffer).toHaveBeenCalledWith();
    expect(spySetLocalDescription).toHaveBeenCalledWith(sdpMockOffer);
    expect(socketMessage).toEqual(
      JSON.stringify({
        from: FINGERPRINT_A,
        to: FINGERPRINT_B,
        data: sdpMockOffer,
      })
    );
  });

  it("should receive and handle an answer", async () => {
    const answer = {
      from: FINGERPRINT_B,
      to: FINGERPRINT_A,
      data: sdpMockAnswer,
    };
    const onSocketSend = new Promise<void>((resolve) => {
      socketServer.on("connection", (socket) => {
        socket.send(JSON.stringify(answer));
        resolve();
      });
    });

    const spySetRemoteDescription = vi.spyOn(
      mockPeerConnection,
      "setRemoteDescription"
    );

    const handler = new WebRTCHandler(
      {
        socketUrl,
        socketApiKey,
        iceServers,
      },
      createSocketInstance,
      mockPeerConnectionInstance,
      mockRTCSessionDescription
    );
    handler.start(FINGERPRINT_A, [FINGERPRINT_B]);

    await onSocketSend;
    expect(mockRTCSessionDescription).toHaveBeenCalledWith(answer.data);
    expect(spySetRemoteDescription).toHaveBeenCalledWith(answer.data);
  });

  it("should receive and handle an ice candidate", async () => {
    const ice = {
      from: FINGERPRINT_B,
      to: FINGERPRINT_A,
      data: iceCandidateMock,
    };
    const onSocketSend = new Promise<void>((resolve) => {
      socketServer.on("connection", (socket) => {
        socket.send(JSON.stringify(ice));
        resolve();
      });
    });

    const spyAddIceCandidate = vi.spyOn(mockPeerConnection, "addIceCandidate");

    const handler = new WebRTCHandler(
      {
        socketUrl,
        socketApiKey,
        iceServers,
      },
      createSocketInstance,
      mockPeerConnectionInstance,
      mockRTCSessionDescription,
      mockRTCIceCandidate
    );
    handler.start(FINGERPRINT_A, [FINGERPRINT_B]);

    await onSocketSend;
    expect(mockRTCIceCandidate).toHaveBeenCalledWith(ice.data);
    expect(spyAddIceCandidate).toHaveBeenCalledWith(ice.data);
  });

  it("should receive and handle an offer", async () => {
    const offer = {
      from: FINGERPRINT_B,
      to: FINGERPRINT_A,
      data: sdpMockOffer,
    };
    const onSocketMessage = new Promise<string>((resolve) => {
      socketServer.on("connection", (socket) => {
        socket.send(JSON.stringify(offer));
        socket.on("message", (data) => {
          resolve(data as string);
        });
      });
    });

    const spySetRemoteDescription = vi.spyOn(
      mockPeerConnection,
      "setRemoteDescription"
    );
    const spyCreateAnswer = vi.spyOn(mockPeerConnection, "createAnswer");
    const spySetLocalDescription = vi.spyOn(
      mockPeerConnection,
      "setLocalDescription"
    );

    const handler = new WebRTCHandler(
      {
        socketUrl,
        socketApiKey,
        iceServers,
      },
      createSocketInstance,
      mockPeerConnectionInstance,
      mockRTCSessionDescription
    );
    handler.start(FINGERPRINT_A, []);

    const socketMessage = await onSocketMessage;
    expect(spySetRemoteDescription).toHaveBeenCalledWith(offer.data);
    expect(spyCreateAnswer).toHaveBeenCalledTimes(1);
    expect(socketMessage).toEqual(
      JSON.stringify({
        from: FINGERPRINT_A,
        to: FINGERPRINT_B,
        data: sdpMockAnswer,
      })
    );
  });
});
