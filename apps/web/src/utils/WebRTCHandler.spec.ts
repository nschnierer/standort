import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as MockSocket from "mock-socket";
import { WebRTCHandler } from "./WebRTCHandler";

const FINGERPRINT_A =
  "ac96cfa3c229e489149d5ad15eee2e0aefb7cabdad5abfa4c76ab695f20ecd14";
const FINGERPRINT_B =
  "bc96cfa3c229e489149d5ad15eee2e0aefb7cabdad5abfa4c76ab695f20ecd14";

const sdpMock = { sdp: "mock", type: "offer" } as RTCSessionDescriptionInit;

const mockDataChannel = {
  onopen: (ev: Event) => null,
} as RTCDataChannel;

const createOffer = (options?: RTCOfferOptions) => Promise.resolve(sdpMock);

const mockPeerConnection = {
  createDataChannel: (label: string, dataChannelDict?: RTCDataChannelInit) =>
    mockDataChannel,
  setLocalDescription: (description?: RTCLocalSessionDescriptionInit) =>
    Promise.resolve(),
  setRemoteDescription: (description: RTCSessionDescriptionInit) =>
    Promise.resolve(),
  createOffer,
  // createAnswer,
  // addIceCandidate: vi.fn(),
  // onicecandidate: null,
  // ondatachannel: null,
} as RTCPeerConnection;

const mockPeerConnectionInstance = vi.fn(() => mockPeerConnection);

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

  it("should send the offer", async () => {
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
    expect(spySetLocalDescription).toHaveBeenCalledWith(sdpMock);
    expect(socketMessage).toEqual(
      JSON.stringify({
        from: FINGERPRINT_A,
        to: FINGERPRINT_B,
        data: sdpMock,
      })
    );
  });
});
