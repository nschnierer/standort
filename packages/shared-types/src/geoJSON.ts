import * as z from "zod";

export const FeatureZod = z.object({
  type: z.string(),
  properties: z.object({
    createdAt: z.string(),
  }),
  geometry: z.object({
    coordinates: z.array(z.number()),
    type: z.string(),
  }),
});

export type Feature = z.infer<typeof FeatureZod>;

export const FeatureCollectionZod = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(FeatureZod),
});

export type FeatureCollection = z.infer<typeof FeatureCollectionZod>;
