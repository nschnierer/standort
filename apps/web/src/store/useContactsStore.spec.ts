import { describe, expect, beforeEach, it } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { generateKeyPair, exportKey } from "../utils/cryptoHelpers";
import { useContactsStore } from "./useContactsStore";
import { useIdentityStore } from "./useIdentityStore";

describe("useContactsStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("should create a new contact", async () => {
    const contactsStore = useContactsStore();

    const keyPair = await generateKeyPair();
    const publicKey = await exportKey(keyPair.publicKey);

    await contactsStore.createContact({ username: "Alice", publicKey });
    expect(contactsStore.contacts.length).toBe(1);
    expect(contactsStore.contacts[0].username).toBe("Alice");
    expect(contactsStore.contacts[0].publicKey.crv).toBeDefined();
  });

  it("should remove an existing contact", async () => {
    const contactsStore = useContactsStore();

    // Create a contact
    const keyPair = await generateKeyPair();
    const publicKey = await exportKey(keyPair.publicKey);
    await contactsStore.createContact({ username: "Alice", publicKey });

    expect(contactsStore.contacts.length).toBe(1);

    const [contact] = contactsStore.contacts;
    await contactsStore.removeContact(contact.fingerprint);
    expect(contactsStore.contacts.length).toBe(0);
  });

  it("should encrypt and decrypt messages for a contact", async () => {
    // Create a identity
    const identityStore = useIdentityStore();
    await identityStore.generateKeys();
    identityStore.$patch({ username: "Alice" });

    const contactsStore = useContactsStore();

    // Create a contact
    const keyPair = await generateKeyPair();
    const publicKey = await exportKey(keyPair.publicKey);
    await contactsStore.createContact({ username: "Bob", publicKey });

    const [contact] = contactsStore.contacts;
    const message = "Highly secret message";

    const cipher = await contactsStore.encryptForContact(
      contact.fingerprint,
      message
    );
    const plaintext = await contactsStore.decryptFromContact(
      contact.fingerprint,
      cipher
    );
    expect(plaintext).toBe(message);
  });

  it("should throw an error when contact is not found", async () => {
    const contactsStore = useContactsStore();
    const invalidFingerprint = "invalid";
    await expect(
      contactsStore.encryptForContact(invalidFingerprint, "23456")
    ).rejects.toThrow("Contact not found");
    await expect(
      contactsStore.decryptFromContact(invalidFingerprint, {
        iv: [1],
        encrypted: [1],
      })
    ).rejects.toThrow("Contact not found");
  });
});
