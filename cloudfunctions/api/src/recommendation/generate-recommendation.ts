import {
  failure,
  recommendationSchema,
  success,
  type ApiEnvelope,
  type Recommendation,
} from "../../../../packages/contracts/src/index.ts";
import type { LlmProvider } from "./llm-provider.ts";
import { generateRulesRecommendation, type RuleInput } from "./rules-engine.ts";

export interface RecommendationRequest {
  outdoorHighCelsius: number;
  outdoorLowCelsius: number;
  outdoorCondition: string;
  itineraries: Array<{
    sceneName: string;
    temperatureCelsius: number;
    durationMinutes: number;
  }>;
  feelPreference: string;
}

export async function generateRecommendation(
  body: unknown,
  llmProvider: LlmProvider | undefined,
  requestId: string,
  timeoutMs: number = 4000,
): Promise<ApiEnvelope<Recommendation>> {
  const input = body as RecommendationRequest;
  if (
    !input ||
    typeof input.outdoorHighCelsius !== "number" ||
    typeof input.outdoorLowCelsius !== "number"
  ) {
    return failure("VALIDATION_ERROR", "缺少天气信息", false, requestId);
  }

  const rulesInput: RuleInput = {
    outdoorHighCelsius: input.outdoorHighCelsius,
    outdoorLowCelsius: input.outdoorLowCelsius,
    outdoorCondition: input.outdoorCondition ?? "",
    itineraries: (input.itineraries ?? []).map((i) => ({
      sceneName: i.sceneName,
      temperatureCelsius: i.temperatureCelsius,
    })),
    feelPreference: input.feelPreference ?? "comfortable",
  };

  if (llmProvider) {
    try {
      const result = await llmProvider.generateRecommendation(input, timeoutMs);
      return success(
        { ...recommendationSchema.parse(result), source: "llm" },
        requestId,
      );
    } catch (e) {
      console.log("LLM err: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  try {
    return success(
      { ...generateRulesRecommendation(rulesInput), source: "rules" },
      requestId,
    );
  } catch {
    return failure(
      "INTERNAL_ERROR",
      "建议生成失败，请稍后重试",
      true,
      requestId,
    );
  }
}
