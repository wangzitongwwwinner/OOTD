import assert from 'node:assert/strict';
import test from 'node:test';

import { QWeatherProvider } from './qweather-provider.ts';

const nowPayload = {
  code: '200',
  updateTime: '2026-07-20T10:00+08:00',
  now: {
    temp: '31',
    feelsLike: '35',
    text: '多云',
    humidity: '68',
    windSpeed: '14',
  },
};

const forecastPayload = {
  code: '200',
  daily: [
    { fxDate: '2026-07-20', tempMax: '34', tempMin: '27', uvIndex: '7' },
  ],
};

test('并行读取实时与当日预报并映射完整天气字段', async () => {
  const urls: string[] = [];
  const provider = new QWeatherProvider(
    { host: 'abc.qweatherapi.com', apiKey: 'secret' },
    async (input) => {
      const url = String(input);
      urls.push(url);
      return new Response(
        JSON.stringify(
          url.includes('/v7/weather/now') ? nowPayload : forecastPayload,
        ),
        { status: 200 },
      );
    },
  );

  assert.deepEqual(
    await provider.getCurrent({
      cityCode: '101020100',
      cityName: '上海',
    }),
    {
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
    },
  );
  assert.equal(urls.length, 2);
  assert.ok(urls.every((url) => url.includes('location=101020100')));
});

test('单个供应商请求失败时最多重试一次', async () => {
  let nowAttempts = 0;
  const provider = new QWeatherProvider(
    { host: 'abc.qweatherapi.com', apiKey: 'secret' },
    async (input) => {
      if (String(input).includes('/v7/weather/now')) {
        nowAttempts += 1;
        if (nowAttempts === 1) return new Response('', { status: 503 });
        return new Response(JSON.stringify(nowPayload), { status: 200 });
      }
      return new Response(JSON.stringify(forecastPayload), { status: 200 });
    },
  );

  await assert.doesNotReject(() =>
    provider.getCurrent({ cityCode: '101020100', cityName: '上海' }),
  );
  assert.equal(nowAttempts, 2);
});

test('拒绝异常 Host 和缺失字段的供应商响应', async () => {
  assert.throws(
    () =>
      new QWeatherProvider({
        host: 'http://bad.example.com',
        apiKey: 'secret',
      }),
  );
  const provider = new QWeatherProvider(
    { host: 'abc.qweatherapi.com', apiKey: 'secret' },
    async () =>
      new Response(JSON.stringify({ code: '200', now: {} }), { status: 200 }),
  );
  await assert.rejects(() =>
    provider.getCurrent({ cityCode: '101020100', cityName: '上海' }),
  );
});
