import assert from 'node:assert/strict';
import test from 'node:test';

import {
  currentWeatherRequestSchema,
  weatherInfoSchema,
} from './weather.ts';

const weather = {
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
  source: 'qweather' as const,
  isStale: false,
};

test('当前天气请求只接受城市级信息与刷新标记', () => {
  assert.deepEqual(
    currentWeatherRequestSchema.parse({
      cityCode: '101020100',
      cityName: '上海',
      refresh: true,
    }),
    { cityCode: '101020100', cityName: '上海', refresh: true },
  );
  assert.equal(
    currentWeatherRequestSchema.safeParse({
      cityCode: '101020100',
      cityName: '上海',
      latitude: 31.2304,
    }).success,
    false,
  );
});

test('天气结果固定完整展示字段和缓存状态', () => {
  assert.deepEqual(weatherInfoSchema.parse(weather), weather);
  assert.equal(
    weatherInfoSchema.safeParse({ ...weather, humidityPercent: 101 }).success,
    false,
  );
  assert.equal(
    weatherInfoSchema.safeParse({ ...weather, internalCacheKey: 'secret' })
      .success,
    false,
  );
});

test('天气允许缺少辅助字段但拒绝最高温低于最低温', () => {
  const { humidityPercent, uvIndex, windSpeedKilometersPerHour, ...required } =
    weather;
  assert.equal(weatherInfoSchema.safeParse(required).success, true);
  assert.equal(
    weatherInfoSchema.safeParse({
      ...weather,
      highCelsius: 20,
      lowCelsius: 25,
    }).success,
    false,
  );
  void humidityPercent;
  void uvIndex;
  void windSpeedKilometersPerHour;
});
