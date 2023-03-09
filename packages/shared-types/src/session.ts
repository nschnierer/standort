import * as z from "zod";
import { FeatureZod } from "./geoJSON.js";

export const SessionMessageZod = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  position: FeatureZod,
});

export type SessionMessage = z.infer<typeof SessionMessageZod>;
