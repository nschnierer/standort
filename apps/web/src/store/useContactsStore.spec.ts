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

  it("should create a contact from a valid Base64 string", async () => {
    // Create a identity to share
    const identityStore = useIdentityStore();
    await identityStore.generateKeys();
    identityStore.$patch({ username: "Alice" });

    const contactsStore = useContactsStore();
    const success = await contactsStore.createContactFromShareData(
      identityStore.shareData
    );
    expect(success).toBeTruthy();
    expect(contactsStore.contacts.length).toBe(1);
    expect(contactsStore.contacts[0].username).toBe("Alice");
    expect(contactsStore.contacts[0].publicKey).toEqual(
      identityStore.publicKey
    );
  });

  it("should create a contact from a specify share object", async () => {
    // This test proofs, if the following structure
    // of the share data is still working.
    const shareData = {
      u: "Johnny",
      key_ops: [],
      ext: true,
      kty: "EC",
      x: "cB8JTqGEWJA7RTUSaySWo7RkEcBqxqqGZkhcYIqV0ts",
      y: "eJr_mkczo4Jaouz3yZwI1x4ltp7Lo7bObphap-6ECCk",
      crv: "P-256",
    };
    const base64 = btoa(JSON.stringify(shareData));

    const contactsStore = useContactsStore();
    const success = await contactsStore.createContactFromShareData(base64);
    expect(contactsStore.contacts.length).toBe(1);

    // Compare the share data with the contact data.
    const { u: username, ...publicKey } = shareData;
    expect(contactsStore.contacts[0].username).toBe(username);
    expect(contactsStore.contacts[0].publicKey).toEqual(publicKey);
  });

  it("should not create a contact when the input is an invalid Base64", async () => {
    const contactsStore = useContactsStore();

    const missingAttributes = btoa(
      JSON.stringify({
        u: "Johnny",
        key_ops: [],
      })
    );
    expect(
      await contactsStore.createContactFromShareData(missingAttributes)
    ).toBeFalsy();
    expect(contactsStore.contacts.length).toBe(0);

    const wrongJSON = btoa("{ ; }");
    expect(
      await contactsStore.createContactFromShareData(wrongJSON)
    ).toBeFalsy();
    expect(contactsStore.contacts.length).toBe(0);

    const wrongBase64 = btoa("324567jhgfewq4567==");
    expect(
      await contactsStore.createContactFromShareData(wrongBase64)
    ).toBeFalsy();
    expect(contactsStore.contacts.length).toBe(0);
  });

  it("should get initials from a username", async () => {
    const contactsStore = useContactsStore();

    // Create a contact
    const keyPair1 = await generateKeyPair();
    const publicKey1 = await exportKey(keyPair1.publicKey);
    await contactsStore.createContact({
      username: "Le",
      publicKey: publicKey1,
    });
    // Create a contact
    const keyPair2 = await generateKeyPair();
    const publicKey2 = await exportKey(keyPair2.publicKey);
    await contactsStore.createContact({
      username: "jon doe",
      publicKey: publicKey2,
    });

    const [contact1, contact2] = contactsStore.contacts;

    expect(contactsStore.getNameInitials("NOTFOUND")).toBe("??");

    expect(contactsStore.getNameInitials(contact1.fingerprint)).toBe("LE");

    expect(contactsStore.getNameInitials(contact2.fingerprint)).toBe("JD");
  });
});
