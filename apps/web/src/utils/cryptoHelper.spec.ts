import { describe, expect, it } from "vitest";
import {
  generateKeyPair,
  exportKey,
  importPrivateKey,
  importPublicKey,
  deriveSecretKey,
  encrypt,
  decrypt,
  generateFingerprint,
} from "./cryptoHelpers";

// NOTE:
// Be aware that these tests are using the crypto API of Node.js (see setupTests.ts).
// Because JSdom does not support the Web Crypto API yet:
// https://github.com/jsdom/jsdom/issues/1612

describe("cryptoHelpers", () => {
  it("should be possible to generate and export keys", async () => {
    const keyPairA = await generateKeyPair();

    // Private JWK
    const jwkPrivate = await window.crypto.subtle.exportKey(
      "jwk",
      keyPairA.privateKey
    );

    // Verify objects
    expect(jwkPrivate).toEqual({
      crv: "P-256",
      d: expect.any(String),
      ext: true,
      key_ops: ["deriveKey"],
      kty: "EC",
      x: expect.any(String),
      y: expect.any(String),
    });

    // Public JWK
    const jwkPublic = await window.crypto.subtle.exportKey(
      "jwk",
      keyPairA.publicKey
    );

    // Verify objects
    expect(jwkPublic).toEqual({
      crv: "P-256",
      ext: true,
      key_ops: [], // Public key has no key_ops
      kty: "EC",
      x: expect.any(String),
      y: expect.any(String),
    });
  });

  it("should be possible to export and import keys", async () => {
    const keyPair = await generateKeyPair();

    const privateJwk = await exportKey(keyPair.privateKey);
    const publicJwk = await exportKey(keyPair.publicKey);

    expect(privateJwk).toBeDefined();
    expect(publicJwk).toBeDefined();

    const privateKey = await importPrivateKey(privateJwk);
    const publicKey = await importPublicKey(publicJwk);

    expect(privateKey).toBeDefined();
    expect(publicKey).toBeDefined();
  });

  it("should encrypt and decrypt correctly", async () => {
    // Generates keys
    const keyPairA = await generateKeyPair();
    const keyPairB = await generateKeyPair();

    // Derive a secret keys from the public key of the other person
    const secretKeyA = await deriveSecretKey(
      keyPairA.privateKey,
      keyPairB.publicKey
    );
    const secretKeyB = await deriveSecretKey(
      keyPairB.privateKey,
      keyPairA.publicKey
    );

    // A sends a message to B
    const secretText = "Please don't tell anyone";
    const cipher = await encrypt(secretKeyA, secretText);

    // Check the content of the object
    expect(cipher).toEqual({
      iv: expect.arrayContaining([expect.any(Number)]),
      encrypted: expect.arrayContaining([expect.any(Number)]),
    });

    const plain = await decrypt(secretKeyB, cipher);
    expect(plain).toBe(secretText);

    // And the other way around
    const secretAnswer = "I won't tell anyone";
    const cipherAnswer = await encrypt(secretKeyB, secretAnswer);

    const plainAnswer = await decrypt(secretKeyA, cipherAnswer);
    expect(plainAnswer).toBe(secretAnswer);
  });

  it("should generate a fingerprint with a given JsonWebKey", async () => {
    const jwk: JsonWebKey = {
      key_ops: [],
      ext: true,
      kty: "EC",
      x: "m_FhidlBT7wJx8Y7PRo-e_wTmHyZlAULJzZuAMb_iVY",
      y: "XTJYuBtNhrPAFLkszafvNBkhFuVu4-ocUa5SvKv0pLg",
      crv: "P-256",
    };

    const fingerprint = await generateFingerprint(jwk);

    expect(fingerprint).toEqual(
      "ec96cfa3c229e489149d5ad15eee2e0aefb7cabdad5abfa4c76ab695f20ecd14"
    );
    expect(fingerprint.length).toBe(64);
  });

  it("should generate a fingerprint with a given CryptoKey", async () => {
    const keyPair = await generateKeyPair();

    const jwt = await exportKey(keyPair.publicKey);
    const fingerprint = await generateFingerprint(jwt);

    // Impossible to generate the same fingerprint twice
    expect(fingerprint).not.toEqual(
      "ec96cfa3c229e489149d5ad15eee2e0aefb7cabdad5abfa4c76ab695f20ecd14"
    );
    expect(fingerprint.length).toBe(64);
  });
});
