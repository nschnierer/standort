import { defineStore } from "pinia";
import {
  generateKeyPair,
  exportKey,
  generateFingerprint,
} from "~/utils/cryptoHelpers";

export type Identity = {
  /** SHA-256 hash of the public key */
  fingerprint: string;
  /** Username defined by the user */
  username: string;
  /** Public key in JWK format */
  publicKey?: JsonWebKey;
  /** Private key in JWK format */
  privateKey?: JsonWebKey;
  /** Last key pair update */
  updatedAt: Date;
  /** Initialisation of the store */
  createdAt: Date;
};

export const useIdentityStore = defineStore("identity", {
  state: (): Identity => ({
    fingerprint: "",
    username: "",
    privateKey: undefined,
    publicKey: undefined,
    updatedAt: new Date(),
    createdAt: new Date(),
  }),
  getters: {
    /** QR-Code data contains the username and the public key */
    qrCodeData: (state) => {
      return state.publicKey
        ? { username: state.username, ...state.publicKey }
        : null;
    },
    exportData: (state) => {
      return {
        username: state.username,
        fingerprint: state.fingerprint,
        publicKey: state.publicKey,
        privateKey: state.privateKey,
        updatedAt: state.updatedAt,
        createdAt: state.createdAt,
      };
    },
  },
  actions: {
    /**
     * Generates a new `publicKey`, `privateKey` and `fingerprint`
     * and updates the store.
     */
    async generateKeys() {
      const keyPair = await generateKeyPair();
      const privateKey = await exportKey(keyPair.privateKey);
      const publicKey = await exportKey(keyPair.publicKey);
      const fingerprint = await generateFingerprint(publicKey);

      const data = {
        fingerprint,
        publicKey,
        privateKey,
        updatedAt: new Date(),
      };

      this.$patch(data);
    },
  },
});
