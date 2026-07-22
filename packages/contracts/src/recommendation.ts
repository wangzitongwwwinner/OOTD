import { z } from "zod";

export const recommendationRequestSchema = z
  .object({
    cityCode: z.string().min(1).max(32),
    cityName: z.string().min(1).max(64),
  })
  .strict();

export const recommendationLayerSchema = z
  .object({
    type: z.enum(["base", "mid", "outer", "accessory"]),
    description: z.string().min(1).max(80),
  })
  .strict();

export const recommendationSchema = z
  .object({
    summary: z.string().min(1).max(200),
    layers: z.array(recommendationLayerSchema).min(1).max(10),
    tips: z.array(z.string().max(200)).max(5),
    source: z.enum(["rules", "llm"]),
  })
  .strict();

export type RecommendationLayer = z.infer<typeof recommendationLayerSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type RecommendationRequest = z.infer<typeof recommendationRequestSchema>;
