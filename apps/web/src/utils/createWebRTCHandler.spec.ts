import { describe, it, expect, vi } from "vitest";
import { createWebRTCHandler } from "./createWebRTCHandler";

const PEER_ID_A =
  "ac96cfa3c229e489149d5ad15eee2e0aefb7cabdad5abfa4c76ab695f20ecd14";
const PEER_ID_B =
  "bc96cfa3c229e489149d5ad15eee2e0aefb7cabdad5abfa4c76ab695f20ecd14";

// const mockRTC = MockRTC.getLocal();
const createDataChannel = vi.fn(() => ({
  send: vi.fn(),
}));

const setLocalDescription = vi.fn();
const setRemoteDescription = vi.fn();
const sdpMock = { sdp: "mock" };
const createOffer = vi.fn(() => Promise.resolve(sdpMock));
const createAnswer = vi.fn(() => Promise.resolve(sdpMock));

const mockPeerConnectionInstance = vi.fn(() => ({
  createDataChannel,
  setLocalDescription,
  setRemoteDescription,
  createOffer,
  createAnswer,
  addIceCandidate: vi.fn(),
  onicecandidate: null,
  ondatachannel: null,
}));

describe("createWebRTCHandler", () => {
  it("should be defined", () => {
    expect(createWebRTCHandler).toBeDefined();
  });

  it("should send an offer", async () => {
    const iceServers = [{ urls: "stun:stun.sipgate.net" }];
    const onSignalingMessage = vi.fn();
    const onMessage = vi.fn();
    const { sendOffer } = createWebRTCHandler({
      iceServers,
      onSignalingMessage,
      onMessage,
      createPeerConnectionInstance: mockPeerConnectionInstance,
    });

    await sendOffer({ from: PEER_ID_A, to: PEER_ID_B });

    expect(mockPeerConnectionInstance).toHaveBeenCalledWith({ iceServers });
    expect(createDataChannel).toHaveBeenCalledWith("data");
    expect(setLocalDescription).toHaveBeenCalledWith(sdpMock);
    expect(onSignalingMessage).toHaveBeenCalledWith({
      from: PEER_ID_A,
      to: PEER_ID_B,
      data: sdpMock,
    });
  });
});
