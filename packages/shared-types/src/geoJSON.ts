import * as z from "zod";

export const FeatureZod = z.object({
  type: z.literal("Feature"),
  properties: z.object({}),
  geometry: z.object({
    coordinates: z.tuple([z.number(), z.number()]),
    type: z.literal("Point"),
  }),
});

export type Feature = z.infer<typeof FeatureZod>;

export const FeatureCollectionZod = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(FeatureZod),
});

export type FeatureCollection = z.infer<typeof FeatureCollectionZod>;
