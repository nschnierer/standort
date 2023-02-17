import crypto from "crypto";

// Make node crypto available for tests
Object.defineProperty(global.self, "crypto", {
  value: {
    subtle: crypto.webcrypto.subtle,
    getRandomValues: crypto.getRandomValues,
  },
});
