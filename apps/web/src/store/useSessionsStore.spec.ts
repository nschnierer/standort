import { describe, expect, beforeEach, it, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import addMinutes from "date-fns/addMinutes";
import subMinutes from "date-fns/subMinutes";
import { Feature } from "shared-types";
import { WebRTCHandler } from "../utils/WebRTCHandler";
import { useSessionsStore, useSessionHandlerStore } from "./useSessionsStore";

vi.mock("../utils/WebRTCHandler");

describe("useSessionsStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("should create a new store", async () => {
    // Create store
    const sessionsStore = useSessionsStore();

    expect(sessionsStore.sessions).toEqual([]);
  });

  it("should start with active sessions", async () => {
    const sessionsStore = useSessionsStore();
    const sessionHandlerStore = useSessionHandlerStore();

    const activeEnd = addMinutes(new Date(), 1);
    const inactiveEnd = subMinutes(new Date(), 1);

    const activeSession = {
      from: "1111",
      to: "4321",
      start: new Date().toISOString(),
      end: activeEnd.toISOString(),
      lastPosition: null,
    };
    const inactiveSession = {
      from: "2222",
      to: "4321",
      start: new Date().toISOString(),
      end: inactiveEnd.toISOString(),
      lastPosition: null,
    };

    sessionsStore.upsertSession(activeSession);
    sessionsStore.upsertSession(inactiveSession);

    sessionHandlerStore.start("4321");

    expect(WebRTCHandler.prototype.start).toHaveBeenCalledWith("4321", [
      "1111",
    ]);
  });

  it("should be start a new session", () => {
    const sessionsStore = useSessionsStore();
    const sessionHandler = useSessionHandlerStore();

    sessionHandler.startSession({ to: "1242", end: new Date() });

    expect(sessionsStore.sessions.length).toBe(1);
    expect(WebRTCHandler.prototype.sendOffer).toHaveBeenCalledTimes(1);
    expect(WebRTCHandler.prototype.sendOffer).toHaveBeenCalledWith("1242");
  });

  it("should send data to all active sessions", () => {
    const sessionHandlerStore = useSessionHandlerStore();

    const end = addMinutes(new Date(), 5);
    sessionHandlerStore.startSession({
      to: "1242",
      end: end,
    });

    const data: Feature = {
      type: "Feature",
      properties: {},
      geometry: { type: "Point", coordinates: [1, 2] },
    };
    sessionHandlerStore.sendToSessions(data);
    expect(WebRTCHandler.prototype.sendMessage).toHaveBeenCalledWith("1242", {
      start: expect.any(String),
      end: end.toISOString(),
      position: data,
    });
  });

  it("should clear all sessions", () => {
    const sessionHandler = useSessionHandlerStore();

    sessionHandler.startSession({ to: "1242", end: new Date() });
    sessionHandler.stopSessions();
    expect(WebRTCHandler.prototype.disconnectPeers).toHaveBeenCalledTimes(1);
  });
});
