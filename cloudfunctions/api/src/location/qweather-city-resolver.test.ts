import assert from 'node:assert/strict';
import test from 'node:test';

import { QWeatherCityResolver } from './qweather-city-resolver.ts';

test('以两位小数坐标调用专属 Host 并只返回城市级信息', async () => {
  let request: { url?: string; init?: RequestInit | undefined } = {};
  const resolver = new QWeatherCityResolver({ host: 'abc.qweatherapi.com', apiKey: 'secret' }, async (url, init) => {
    request = { url: String(url), init };
    return new Response(JSON.stringify({ code: '200', location: [{ id: '101020100', name: '黄浦', adm2: '上海', lat: '31.23', lon: '121.47' }] }), { status: 200 });
  });
  await assert.doesNotReject(async () => {
    assert.deepEqual(await resolver.resolve({ latitude: 31.2304, longitude: 121.4737 }), {
      cityCode: '101020100', cityName: '上海',
    });
  });
  assert.match(request.url ?? '', /location=121\.47%2C31\.23/);
  assert.equal(new Headers(request.init?.headers).get('X-QW-Api-Key'), 'secret');
});

test('拒绝非 HTTPS Host 和异常供应商响应', async () => {
  assert.throws(() => new QWeatherCityResolver({ host: 'http://bad.example.com', apiKey: 'secret' }));
  const resolver = new QWeatherCityResolver(
    { host: 'abc.qweatherapi.com', apiKey: 'secret' },
    async () => new Response(JSON.stringify({ code: '500', location: [] }), { status: 200 }),
  );
  await assert.rejects(() => resolver.resolve({ latitude: 31, longitude: 121 }));
});
