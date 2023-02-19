/**
 * @deprecated Will be removed later
 */
export const generateFingerprint = async (publicKey: JsonWebKey) => {
  // Just use the relevant parts of the JWK
  // See  RFC7638 for more information.
  const minimalPublicKey = {
    kty: publicKey.kty,
    n: publicKey.n,
    e: publicKey.e,
  };
  const buffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(minimalPublicKey))
  );
  const hashArray = Array.from(new Uint8Array(buffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hash;
};
