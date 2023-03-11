import { describe, expect, beforeEach, it } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useContactsStore } from "./useContactsStore";

const jwtPublicKey = {
  crv: "P-256",
  ext: true,
  key_ops: [],
  kty: "EC",
  x: "B-Z05PVtYGLu0ZcCgPABqeNxp2-1N-BQqGI1iKrq0Go",
  y: "TN1DBXwR1x6TWHLQONPk4uGEm6O51zjqvaayXOLtLY4",
};

describe("useContactsStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("should add a contact with fingerprint", async () => {
    const contactStore = useContactsStore();

    const username = "Maria";
    await contactStore.createContact({
      username,
      publicKey: jwtPublicKey,
    });

    expect(contactStore.contacts).toEqual([
      {
        username,
        publicKey: jwtPublicKey,
        fingerprint:
          "5f786b7614d0dd9b7c69d04ae24bd5d51a31f4e331a12740f381513ed14be5a5",
        addedAt: expect.any(Date),
      },
    ]);
  });
});
