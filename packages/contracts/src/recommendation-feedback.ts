import { z } from "zod";

export const recommendationRatingSchema = z.enum([
  "helpful",
  "neutral",
  "unhelpful",
]);

export const recommendationFeedbackRequestSchema = z
  .object({ rating: recommendationRatingSchema })
  .strict();

export const recommendationFeedbackSchema = z
  .object({
    recommendationId: z.string().min(1),
    rating: recommendationRatingSchema,
    updatedAt: z.string().datetime(),
  })
  .strict();

export type RecommendationRating = z.infer<typeof recommendationRatingSchema>;
export type RecommendationFeedbackRequest = z.infer<
  typeof recommendationFeedbackRequestSchema
>;
export type RecommendationFeedback = z.infer<
  typeof recommendationFeedbackSchema
>;
