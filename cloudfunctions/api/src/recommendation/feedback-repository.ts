import type {
  RecommendationFeedback,
  RecommendationRating,
} from "../../../../packages/contracts/src/index.ts";
import type { TrustedIdentity } from "../context.ts";

export interface FeedbackRepository {
  upsert(input: {
    identity: TrustedIdentity;
    recommendationId: string;
    rating: RecommendationRating;
    now: string;
  }): Promise<
    | { status: "saved"; feedback: RecommendationFeedback }
    | { status: "recommendation_not_found" }
  >;
}
