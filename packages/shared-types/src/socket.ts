import { z } from "zod";

export const ClientAddressZod = z
  .string()
  .regex(/^[a-fA-F0-9]{64}$/)
  .transform((s) => s.toLowerCase());

export const SocketMessageBaseZod = z
  .object({
    from: ClientAddressZod,
    to: ClientAddressZod,
    data: z.any(),
  })
  .required();

export type SocketMessageBase = z.infer<typeof SocketMessageBaseZod>;

export const SocketMessageDecryptedZod = SocketMessageBaseZod.extend({
  data: z.object({
    iv: z.array(z.number()),
    encrypted: z.array(z.number()),
  }),
});

export type SocketMessageDecrypted = z.infer<typeof SocketMessageDecryptedZod>;

export const SocketMessageICEZod = SocketMessageBaseZod.extend({
  data: z.object({
    candidate: z.string().optional(),
    sdpMLineIndex: z.number().nullish(),
    sdpMid: z.string().nullable().nullish(),
    usernameFragment: z.string().nullish(),
  }),
});

export type SocketMessageICE = z.infer<typeof SocketMessageICEZod>;

export const SocketMessageSDPZod = SocketMessageBaseZod.extend({
  data: z.object({
    sdp: z.string().optional(),
    type: z.enum(["offer", "answer", "pranswer", "rollback"]),
  }),
});

export type SocketMessageSDP = z.infer<typeof SocketMessageSDPZod>;

export type SocketMessage = SocketMessageICE | SocketMessageSDP;

export const isSessionDescription = (
  message: SocketMessage
): message is SocketMessageSDP => {
  return "sdp" in message.data;
};

export const isIceCandidate = (
  message: SocketMessage
): message is SocketMessageICE => {
  return "candidate" in message.data;
};
