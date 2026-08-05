import {
  failure,
  recommendationFeedbackRequestSchema,
  success,
  type ApiEnvelope,
  type RecommendationFeedback,
} from "../../../../packages/contracts/src/index.ts";
import type { TrustedIdentity } from "../context.ts";
import type { FeedbackRepository } from "./feedback-repository.ts";

export async function saveRecommendationFeedback(
  recommendationId: string,
  body: unknown,
  identity: TrustedIdentity,
  repository: FeedbackRepository,
  requestId: string,
  clock: () => Date = () => new Date(),
): Promise<ApiEnvelope<RecommendationFeedback>> {
  if (!recommendationId)
    return failure("VALIDATION_ERROR", "缺少建议 ID", false, requestId);
  const parsed = recommendationFeedbackRequestSchema.safeParse(body);
  if (!parsed.success)
    return failure("VALIDATION_ERROR", "评价选项无效", false, requestId);

  try {
    const result = await repository.upsert({
      identity,
      recommendationId,
      rating: parsed.data.rating,
      now: clock().toISOString(),
    });
    if (result.status === "recommendation_not_found")
      return failure("NOT_FOUND", "该建议已失效，请重新生成", false, requestId);
    return success(result.feedback, requestId);
  } catch {
    return failure(
      "INTERNAL_ERROR",
      "评价保存失败，请稍后重试",
      true,
      requestId,
    );
  }
}
