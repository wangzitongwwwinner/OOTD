import assert from 'node:assert/strict';
import test from 'node:test';

import type { WeatherInfo } from '../../../../packages/contracts/src/index.ts';
import { getCurrentWeather } from './current-weather.ts';
import type {
  WeatherCache,
  WeatherCacheRepository,
  WeatherProvider,
} from './weather-provider.ts';

const weather: WeatherInfo = {
  cityCode: '101020100',
  cityName: '上海',
  localDate: '2026-07-20',
  condition: '多云',
  temperatureCelsius: 31,
  feelsLikeCelsius: 35,
  humidityPercent: 68,
  highCelsius: 34,
  lowCelsius: 27,
  uvIndex: 7,
  windSpeedKilometersPerHour: 14,
  observedAt: '2026-07-20T02:00:00.000Z',
  source: 'qweather',
  isStale: false,
};

function dependencies(cached?: WeatherCache) {
  const provider: WeatherProvider = { getCurrent: async () => weather };
  const cache: WeatherCacheRepository = {
    find: async () => cached,
    save: async () => undefined,
  };
  return { provider, cache };
}

test('未强制刷新时优先返回未过期城市天气缓存', async () => {
  const deps = dependencies({
    weather,
    expiresAt: '2026-07-20T02:15:00.000Z',
  });
  let providerCalled = false;
  deps.provider.getCurrent = async () => {
    providerCalled = true;
    return weather;
  };

  const response = await getCurrentWeather(
    { cityCode: '101020100', cityName: '上海' },
    deps.provider,
    deps.cache,
    'req_weather_cache',
    () => new Date('2026-07-20T02:10:00.000Z'),
  );

  assert.deepEqual(response, {
    data: weather,
    requestId: 'req_weather_cache',
  });
  assert.equal(providerCalled, false);
});

test('强制刷新会调用供应商并写入十五分钟缓存', async () => {
  const deps = dependencies();
  let saved: WeatherCache | undefined;
  deps.cache.save = async (value) => {
    saved = value;
  };

  const response = await getCurrentWeather(
    { cityCode: '101020100', cityName: '上海', refresh: true },
    deps.provider,
    deps.cache,
    'req_weather_refresh',
    () => new Date('2026-07-20T02:10:00.000Z'),
  );

  assert.deepEqual(response, {
    data: weather,
    requestId: 'req_weather_refresh',
  });
  assert.deepEqual(saved, {
    weather,
    expiresAt: '2026-07-20T02:25:00.000Z',
  });
});

test('供应商失败时返回已有过期缓存并标记陈旧', async () => {
  const deps = dependencies({
    weather,
    expiresAt: '2026-07-20T02:00:00.000Z',
  });
  deps.provider.getCurrent = async () => {
    throw new Error('provider timeout');
  };

  const response = await getCurrentWeather(
    { cityCode: '101020100', cityName: '上海', refresh: true },
    deps.provider,
    deps.cache,
    'req_weather_stale',
    () => new Date('2026-07-20T02:10:00.000Z'),
    { error: () => undefined },
  );

  assert.deepEqual(response, {
    data: { ...weather, isStale: true },
    requestId: 'req_weather_stale',
  });
});

test('供应商失败且无缓存时返回友好可重试错误', async () => {
  const deps = dependencies();
  deps.provider.getCurrent = async () => {
    throw new Error('provider timeout');
  };

  const response = await getCurrentWeather(
    { cityCode: '101020100', cityName: '上海' },
    deps.provider,
    deps.cache,
    'req_weather_failure',
    () => new Date('2026-07-20T02:10:00.000Z'),
    { error: () => undefined },
  );

  assert.deepEqual(response, {
    error: {
      code: 'EXTERNAL_SERVICE_ERROR',
      message: '天气服务暂时不可用，请稍后重试',
      retryable: true,
    },
    requestId: 'req_weather_failure',
  });
});

test('天气刷新失败只记录脱敏诊断信息', async () => {
  const deps = dependencies();
  deps.provider.getCurrent = async () => {
    throw new Error('QWeather now code 204');
  };
  const messages: string[] = [];

  await getCurrentWeather(
    { cityCode: '101020100', cityName: '上海' },
    deps.provider,
    deps.cache,
    'req_weather_diagnostic',
    () => new Date('2026-07-20T02:10:00.000Z'),
    { error: (message) => messages.push(message) },
  );

  assert.deepEqual(messages, [
    'Weather refresh failed: QWeather now code 204',
  ]);
});
