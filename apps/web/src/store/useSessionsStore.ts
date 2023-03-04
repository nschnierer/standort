import { defineStore } from "pinia";
import { computed, reactive, watch } from "vue";
import {
  SocketMessageICEZod,
  SocketMessageSDPZod,
  FeatureCollection,
} from "shared-types";
import { WebRTCHandler, Envelope } from "~/utils/WebRTCHandler";

const iceServers = [
  { urls: ["stun:stun.sipgate.net", "stun:stun.services.mozilla.com"] },
];

const SIGNALING_URL =
  import.meta.env.VITE_SIGNALING_URL ?? "ws://localhost:6000";
const SIGNALING_API_KEY = import.meta.env.VITE_SIGNALING_API_KEY ?? "";

console.log("Use signaling server:", SIGNALING_URL);

export interface Session {
  from: string;
  to: string;
  start: Date;
  end: Date;
  lastPosition: FeatureCollection | null;
}

export const useSessionsStore = defineStore("sessions", {
  state: (): { sessions: Session[] } => ({
    sessions: [],
  }),
  getters: {
    activeSessions: (state) => {
      return state.sessions.filter(
        (session) => new Date(session.end) > new Date()
      );
    },
    activeFingerprints: (state) => {
      const fingerprints = new Set<string>();
      state.sessions.forEach((session) => {
        console.log("Session end:", session.end);
        if (new Date(session.end) > new Date()) {
          fingerprints.add(session.from);
          fingerprints.add(session.to);
        }
      });
      return Array.from(fingerprints);
    },
  },
  actions: {
    addSession(session: Session) {
      const index = this.$state.sessions.findIndex(
        ({ from, to }) => session.from === from && session.to === to
      );

      if (index > -1) {
        // Update existing session
        this.$patch((state) => {
          state.sessions[index] = session;
        });
        return;
      }
      this.$patch((state) => {
        state.sessions.push(session);
      });
    },
    clearSessions() {
      this.$patch({ sessions: [] });
    },
  },
});

interface StartSessionOptions {
  to: string;
  end: Date;
}

export const useSessionHandlerStore = defineStore("sessionHandler", () => {
  const sessionsStore = useSessionsStore();

  const webRTCHandler = new WebRTCHandler({
    socketUrl: SIGNALING_URL,
    socketApiKey: SIGNALING_API_KEY,
    iceServers,
  });

  webRTCHandler.onMessage((from: string, message: FeatureCollection) => {
    const to = webRTCHandler.getMyCurrentFingerprint();
    sessionsStore.addSession({
      from,
      to,
      start: new Date(),
      end: new Date(),
      lastPosition: message,
    });
  });

  const startSession = ({ to, end }: StartSessionOptions) => {
    const from = webRTCHandler.getMyCurrentFingerprint();
    sessionsStore.addSession({
      from,
      to,
      start: new Date(),
      end,
      lastPosition: null,
    });
    webRTCHandler.sendOffer(to);
  };

  const sendToSessions = (data: FeatureCollection) => {
    const from = webRTCHandler.getMyCurrentFingerprint();
    sessionsStore.sessions.forEach((session) => {
      if (session.from === from) {
        webRTCHandler.sendMessage(session.to, data);
      }
    });
  };

  const stopSessions = () => {
    sessionsStore.clearSessions();
    webRTCHandler.disconnectPeers();
  };

  const start = (myFingerprint: string) => {
    webRTCHandler.start(myFingerprint, sessionsStore.activeFingerprints);
  };

  return {
    start,
    startSession,
    sendToSessions,
    stopSessions,
  };
});
