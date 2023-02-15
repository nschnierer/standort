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
