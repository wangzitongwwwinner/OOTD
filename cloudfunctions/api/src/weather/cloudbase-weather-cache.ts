import type { Db } from '@cloudbase/database';

import {
  weatherInfoSchema,
  type WeatherInfo,
} from '../../../../packages/contracts/src/index.ts';
import type {
  WeatherCache,
  WeatherCacheRepository,
} from './weather-provider.ts';

interface StoredWeatherCache {
  weather?: unknown;
  expiresAt?: unknown;
}

export class CloudBaseWeatherCache implements WeatherCacheRepository {
  constructor(private readonly database: Db) {}

  async find(cityCode: string): Promise<WeatherCache | undefined> {
    const result = await this.database
      .collection('weatherCache')
      .doc(cacheId(cityCode))
      .get();
    const stored = result.data[0] as StoredWeatherCache | undefined;
    if (!stored || typeof stored.expiresAt !== 'string') return undefined;
    const parsed = weatherInfoSchema.safeParse(stored.weather);
    return parsed.success
      ? { weather: parsed.data, expiresAt: stored.expiresAt }
      : undefined;
  }

  async save(cache: WeatherCache): Promise<void> {
    const weather: WeatherInfo = weatherInfoSchema.parse(cache.weather);
    const now = new Date().toISOString();
    await this.database
      .collection('weatherCache')
      .doc(cacheId(weather.cityCode))
      .set({
        id: cacheId(weather.cityCode),
        cityCode: weather.cityCode,
        weather,
        observedAt: weather.observedAt,
        expiresAt: cache.expiresAt,
        createdAt: now,
        updatedAt: now,
        version: 1,
      });
  }
}

function cacheId(cityCode: string) {
  return `weather_${cityCode}`;
}
