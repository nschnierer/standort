import * as z from "zod";

export const ContactShareZod = z.object({
  // Short key because the contact data will be shared by a QR code.
  u: z.string().describe("Username"),
  // JsonWebKey format:
  crv: z.string(),
  ext: z.boolean(),
  key_ops: z.array(z.string()),
  kty: z.string(),
  x: z.string(),
  y: z.string(),
});

export type ContactShare = z.infer<typeof ContactShareZod>;
