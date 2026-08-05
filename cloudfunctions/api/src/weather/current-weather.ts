import {
  currentWeatherRequestSchema,
  failure,
  success,
  weatherInfoSchema,
  type ApiEnvelope,
  type WeatherInfo,
} from '../../../../packages/contracts/src/index.ts';

import type {
  WeatherCacheRepository,
  WeatherProvider,
} from './weather-provider.ts';

const CACHE_TTL_MS = 15 * 60 * 1000;

export async function getCurrentWeather(
  body: unknown,
  provider: WeatherProvider,
  cache: WeatherCacheRepository,
  requestId: string,
  now: () => Date = () => new Date(),
  logger: Pick<Console, 'error'> = console,
): Promise<ApiEnvelope<WeatherInfo>> {
  const parsed = currentWeatherRequestSchema.safeParse(body);
  if (!parsed.success) {
    return failure(
      'VALIDATION_ERROR',
      '城市信息无效，请重新定位后重试',
      false,
      requestId,
    );
  }

  const currentTime = now();
  let cached;
  try {
    cached = await cache.find(parsed.data.cityCode);
  } catch {
    cached = undefined;
  }

  if (
    !parsed.data.refresh &&
    cached &&
    Date.parse(cached.expiresAt) > currentTime.getTime()
  ) {
    return success(
      weatherInfoSchema.parse({ ...cached.weather, isStale: false }),
      requestId,
    );
  }

  try {
    const weather = weatherInfoSchema.parse(
      await provider.getCurrent(parsed.data),
    );
    await cache.save({
      weather,
      expiresAt: new Date(currentTime.getTime() + CACHE_TTL_MS).toISOString(),
    });
    return success(weather, requestId);
  } catch (error) {
    logger.error(`Weather refresh failed: ${safeDiagnostic(error)}`);
    if (cached) {
      return success(
        weatherInfoSchema.parse({ ...cached.weather, isStale: true }),
        requestId,
      );
    }
    return failure(
      'EXTERNAL_SERVICE_ERROR',
      '天气服务暂时不可用，请稍后重试',
      true,
      requestId,
    );
  }
}

function safeDiagnostic(error: unknown): string {
  if (!(error instanceof Error)) return 'unknown error';
  return error.message
    .replace(/https?:\/\/\S+/gi, '[url]')
    .replace(/(key|token|secret)=[^\s&]+/gi, '$1=[redacted]')
    .slice(0, 200);
}
