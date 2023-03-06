import { reactive, onMounted } from "vue";
import { defineStore } from "pinia";
import { useIdentityStore } from "~/store/useIdentityStore";
import {
  importPublicKey,
  deriveSecretKey,
  encrypt,
  decrypt,
  EncryptedData,
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
  actions: {
    /**
     * Create a new contact.
     */
    async createContact(contact: Omit<Contact, "addedAt">) {
      this.$patch((state) => {
        state.contacts.push({ ...contact, addedAt: new Date() });
      });
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
