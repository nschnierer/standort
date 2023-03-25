import { defineStore } from "pinia";
import { ContactShareZod } from "shared-types";
import { useIdentityStore } from "~/store/useIdentityStore";
import {
  importPublicKey,
  deriveSecretKey,
  encrypt,
  decrypt,
  EncryptedData,
  generateFingerprint,
} from "~/utils/cryptoHelpers";

/**
 * A contact is a identity of another user.
 * It contains relevant data to establish a secure connection.
 */
export type Contact = {
  /** SHA-256 hash of the public key */
  fingerprint: string;
  /** Username defined by the user */
  username: string;
  /** Public key in JWK format */
  publicKey: JsonWebKey;
  /** Date when the contact was added */
  addedAt: Date;
};

export const useContactsStore = defineStore("contacts", {
  state: () => ({
    contacts: [] as Contact[],
  }),
  getters: {
    getContactUsername: (state) => (fingerprint: string) => {
      const contact = state.contacts.find(
        (contact) => contact.fingerprint === fingerprint
      );
      if (!contact) {
        return "Unknown";
      }
      return contact.username ?? "Unknown";
    },
  },
  actions: {
    /**
     * Create a new contact.
     */
    async createContact(contact: Omit<Contact, "addedAt" | "fingerprint">) {
      const fingerprint = await generateFingerprint(contact.publicKey);
      this.$patch((state) => {
        state.contacts.push({ ...contact, fingerprint, addedAt: new Date() });
      });
    },

    /**
     * Creates a contact from the input which could be a URL or a Base64 string.
     * This object is described in `ContactShare` type.
     * @param base64 Base64 encoded JSON string
     */
    async createContactFromShareData(input: string) {
      let base64 = "";

      try {
        // Maybe the input is a URL
        // This allows the user to scan the QR code with other apps.
        const url = new URL(input);
        base64 = url.searchParams.get("s") ?? "";
      } catch (error) {
        // Not a URL, the input is the base64 string
        base64 = input;
      }

      let json: JSON;
      try {
        const jsonRaw = atob(base64);
        json = JSON.parse(jsonRaw);
      } catch (error) {
        console.error("Unable to parse share object", error);
        return false;
      }

      const contact = ContactShareZod.safeParse(json);
      if (!contact.success) {
        console.error("Unable to safe parse share object", contact.error);
        return false;
      }

      const { u: username, ...publicKey } = contact.data;
      await this.createContact({
        username,
        publicKey,
      });
      return true;
    },

    /**
     * Remove a contact by its fingerprint.
     */
    async removeContact(fingerprint: string) {
      this.$patch((state) => {
        state.contacts = state.contacts.filter(
          (contact) => contact.fingerprint !== fingerprint
        );
      });
    },

    /**
     * Encrypt message for the given contact.
     * @param fingerprint Contact's fingerprint
     * @param message Message to encrypt
     * @returns Cipher object
     */
    async encryptForContact(fingerprint: string, message: string) {
      const contact = this.contacts.find(
        (contact) => contact.fingerprint === fingerprint
      );
      if (!contact) {
        throw new Error("Contact not found");
      }
      // Get private key of my identity
      const identityStore = await useIdentityStore();
      const privateKey = await identityStore.privateCryptoKey();
      // Get public key of the contact
      const publicKey = await importPublicKey(contact.publicKey);

      // Derive a secret key from the private and public key
      const secretKey = await deriveSecretKey(privateKey, publicKey);

      return encrypt(secretKey, message);
    },

    /**
     * Decrypt a message from the given contact.
     * @param fingerprint Contact's fingerprint
     * @param cipher Cipher object
     * @returns Plaintext message
     */
    async decryptFromContact(fingerprint: string, cipher: EncryptedData) {
      const contact = this.contacts.find(
        (contact) => contact.fingerprint === fingerprint
      );
      if (!contact) {
        throw new Error("Contact not found");
      }
      // Get private key of my identity
      const identityStore = await useIdentityStore();
      const privateKey = await identityStore.privateCryptoKey();
      // Get public key of the contact
      const publicKey = await importPublicKey(contact.publicKey);

      // Derive a secret key from the private and public key
      const secretKey = await deriveSecretKey(privateKey, publicKey);

      return decrypt(secretKey, cipher);
    },
  },
});
