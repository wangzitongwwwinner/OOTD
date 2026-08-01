import type { ApiEnvelope, Recommendation } from "../../../../packages/contracts/src/index.ts";
import type { TrustedIdentity } from "../context.ts";
import { recordMetricSafely } from "../metrics/cloudbase-metrics-recorder.ts";
import type { MetricsRecorder } from "../metrics/metrics-recorder.ts";
import { generateRecommendation } from "./generate-recommendation.ts";
import type { LlmProvider } from "./llm-provider.ts";

const GENERIC_INPUT = {
  outdoorHighCelsius: 26,
  outdoorLowCelsius: 18,
  outdoorCondition: "通用天气",
  itineraries: [
    { sceneName: "通勤", temperatureCelsius: 22, durationMinutes: 60 },
    { sceneName: "办公室", temperatureCelsius: 24, durationMinutes: 480 },
  ],
  feelPreference: "comfortable",
};

export async function generateGenericRecommendation(
  llm: LlmProvider | undefined,
  requestId: string,
  identity?: TrustedIdentity,
  metrics?: MetricsRecorder,
  clock: () => Date = () => new Date(),
): Promise<ApiEnvelope<Recommendation>> {
  const response = await generateRecommendation(GENERIC_INPUT, llm, requestId);
  if ("data" in response && identity && metrics) {
    await recordMetricSafely(() =>
      metrics.recordRecommendation(identity, {
        recommendationId: requestId,
        source: response.data.source,
        createdAt: clock().toISOString(),
      }),
    );
  }
  return response;
}
