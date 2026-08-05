import {
  failure,
  recommendationRequestSchema,
  type ApiEnvelope,
  type Recommendation,
} from "../../../../packages/contracts/src/index.ts";
import type { UserRepository } from "../auth/user-repository.ts";
import type { TrustedIdentity } from "../context.ts";
import type { ItineraryRepository } from "../itineraries/repository.ts";
import { recordMetricSafely } from "../metrics/cloudbase-metrics-recorder.ts";
import type { MetricsRecorder } from "../metrics/metrics-recorder.ts";
import { getCurrentWeather } from "../weather/current-weather.ts";
import type {
  WeatherCacheRepository,
  WeatherProvider,
} from "../weather/weather-provider.ts";
import { generateRecommendation } from "./generate-recommendation.ts";
import type { LlmProvider } from "./llm-provider.ts";

interface RecommendationDependencies {
  users: UserRepository;
  itineraries: ItineraryRepository;
  weather: { provider: WeatherProvider; cache: WeatherCacheRepository };
  llm?: LlmProvider;
  metrics?: MetricsRecorder;
}

export async function orchestrateRecommendation(
  body: unknown,
  identity: TrustedIdentity,
  dependencies: RecommendationDependencies,
  requestId: string,
  clock: () => Date = () => new Date(),
): Promise<ApiEnvelope<Recommendation>> {
  const request = recommendationRequestSchema.safeParse(body);
  if (!request.success)
    return failure(
      "VALIDATION_ERROR",
      "城市信息无效，请重新定位后重试",
      false,
      requestId,
    );

  try {
    const weatherResponse = await getCurrentWeather(
      request.data,
      dependencies.weather.provider,
      dependencies.weather.cache,
      requestId,
    );
    if (!("data" in weatherResponse)) return weatherResponse;
    const [profile, itineraries] = await Promise.all([
      dependencies.users.findByWechatIdentity(identity),
      dependencies.itineraries.findByDate(
        weatherResponse.data.localDate,
        identity,
      ),
    ]);
    if (!profile)
      return failure(
        "NOT_FOUND",
        "用户资料不存在，请重新登录",
        false,
        requestId,
      );

    const response = await generateRecommendation(
      {
        outdoorHighCelsius: weatherResponse.data.highCelsius,
        outdoorLowCelsius: weatherResponse.data.lowCelsius,
        outdoorCondition: weatherResponse.data.condition,
        itineraries: itineraries.map((item) => ({
          sceneName: item.sceneName,
          temperatureCelsius: item.estimatedTemperatureCelsius,
          durationMinutes: item.durationMinutes,
        })),
        feelPreference: profile.recentFeelPreference,
      },
      dependencies.llm,
      requestId,
    );
    if ("data" in response && dependencies.metrics) {
      await recordMetricSafely(() =>
        dependencies.metrics!.recordRecommendation(identity, {
          recommendationId: requestId,
          source: response.data.source,
          createdAt: clock().toISOString(),
        }),
      );
    }
    return response;
  } catch {
    return failure(
      "INTERNAL_ERROR",
      "建议生成失败，请稍后重试",
      true,
      requestId,
    );
  }
}
