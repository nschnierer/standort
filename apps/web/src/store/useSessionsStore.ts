import { defineStore } from "pinia";
import isBefore from "date-fns/isBefore";
import { useIdentityStore } from "./useIdentityStore";
import { useContactsStore } from "./useContactsStore";
import { SessionMessage, Feature } from "shared-types";
import { WebRTCHandler } from "~/utils/WebRTCHandler";

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
  start: string;
  end: string;
  lastPosition: Feature | null;
}

const isActiveSession = (session: Session, current = new Date()) => {
  return isBefore(current, new Date(session.end));
};

export const useSessionsStore = defineStore("sessions", {
  state: (): { sessions: Session[] } => ({
    sessions: [],
  }),
  getters: {
    activeSessions(state) {
      return state.sessions.filter((session) => isActiveSession(session));
    },
    activeSessionPerContact() {
      const myFingerprint = useIdentityStore().fingerprint;

      const contactMap: {
        [contactFingerprint: string]: {
          incoming?: Session;
          outgoing?: Session;
        };
      } = {};

      for (const session of this.activeSessions) {
        if (myFingerprint === session.from) {
          contactMap[session.to] = {
            ...contactMap[session.to],
            outgoing: session,
          };
        } else {
          contactMap[session.from] = {
            ...contactMap[session.from],
            incoming: session,
          };
        }
      }
      return contactMap;
    },
  },
  actions: {
    upsertSession(session: Session) {
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
  const contactStore = useContactsStore();

  const webRTCHandler = new WebRTCHandler({
    socketUrl: SIGNALING_URL,
    socketApiKey: SIGNALING_API_KEY,
    iceServers,
  });

  webRTCHandler.registerEncryptMessage(contactStore.encryptForContact);
  webRTCHandler.registerDecryptMessage(contactStore.decryptFromContact);

  webRTCHandler.onMessage((from: string, message: SessionMessage) => {
    const to = webRTCHandler.getMyCurrentFingerprint();
    sessionsStore.upsertSession({
      from,
      to,
      start: message.start,
      end: message.end,
      lastPosition: message.position,
    });
  });

  const startSession = ({ to, end }: StartSessionOptions) => {
    const from = webRTCHandler.getMyCurrentFingerprint();
    sessionsStore.upsertSession({
      from,
      to,
      start: new Date().toISOString(),
      end: end.toISOString(),
      lastPosition: null,
    });
    webRTCHandler.sendOffer(to);
  };

  const sendToSessions = (data: Feature) => {
    const from = webRTCHandler.getMyCurrentFingerprint();
    sessionsStore.sessions.forEach((session) => {
      const start = new Date(session.start);
      const end = new Date(session.end);
      if (session.from === from && new Date() <= end) {
        webRTCHandler.sendMessage(session.to, {
          start: start.toISOString(),
          end: end.toISOString(),
          position: data,
        });
      }
    });
  };

  const stopSessions = () => {
    sessionsStore.clearSessions();
    webRTCHandler.disconnectPeers();
  };

  const start = (myFingerprint: string) => {
    const contactFingerprints = Object.keys(
      sessionsStore.activeSessionPerContact
    );
    webRTCHandler.start(myFingerprint, contactFingerprints);
  };

  return {
    start,
    startSession,
    sendToSessions,
    stopSessions,
  };
});
