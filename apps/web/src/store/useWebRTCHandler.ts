import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";

const iceServers = [
  { urls: ["stun:stun.sipgate.net", "stun:stun.services.mozilla.com"] },
];

const SIGNALING_URL =
  import.meta.env.VITE_SIGNALING_URL || "ws://localhost:6000";
const SIGNALING_API_KEY = import.meta.env.VITE_SIGNALING_API_KEY || "";

console.log("Use signaling server:", SIGNALING_URL);

interface Peer {
  connection: RTCPeerConnection;
  channel: RTCDataChannel;
}

interface Sessions {}

export const useSessions = defineStore("sessions", () => {
  const peers = new Map<string, string>();

  const count = computed(() => peers.size);

  const addPeer = (peer: string) => {
    peers.set(peer, peer);
  };

  return { count };
});
