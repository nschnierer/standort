import pino from "pino";

export const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

/**
 * Check if the origin is allowed to connect.
 */
export const isOriginAllowed = (origin: string) => {
  // put logic here to detect whether the specified origin is allowed.
  return true;
};
