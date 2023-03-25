import { describe, expect, beforeEach, it } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useIdentityStore } from "./useIdentityStore";

describe("useIdentityStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("should create a new public and private key", async () => {
    // Create a identity
    const identityStore = useIdentityStore();
    await identityStore.generateKeys();
    // Update the username
    identityStore.$patch({ username: "Alice" });

    expect(identityStore.fingerprint).toBeDefined();
    expect(identityStore.username).toEqual("Alice");
    expect(identityStore.publicKey).toBeDefined();
    expect(identityStore.privateKey).toBeDefined();
  });

  it("should generate a getter shareData", async () => {
    // Create a identity
    const identityStore = useIdentityStore();
    await identityStore.generateKeys();
    // Update the username
    identityStore.$patch({ username: "Alice" });

    // Will be tested in useContactsStore.spec.ts
    expect(identityStore.shareData).toBeDefined();
  });
});
