import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveCity } from './resolve-city.ts';

test('使用适配器解析城市且响应不返回精确坐标', async () => {
  let received: unknown;
  const response = await resolveCity(
    { latitude: 31.2304, longitude: 121.4737 },
    { resolve: async (input) => { received = input; return { cityCode: '101020100', cityName: '上海' }; } },
    'req_city',
  );
  assert.deepEqual(received, { latitude: 31.2304, longitude: 121.4737 });
  assert.deepEqual(response, {
    data: { cityCode: '101020100', cityName: '上海' }, requestId: 'req_city',
  });
});

test('拒绝越界坐标和客户端伪造身份', async () => {
  let called = false;
  const resolver = { resolve: async () => { called = true; return { cityCode: 'x', cityName: 'x' }; } };
  const invalid = await resolveCity({ latitude: 91, longitude: 0 }, resolver, 'req_invalid');
  const forged = await resolveCity({ latitude: 31, longitude: 121, userId: 'forged' }, resolver, 'req_forged');
  assert.equal('error' in invalid && invalid.error.code, 'VALIDATION_ERROR');
  assert.equal('error' in forged && forged.error.code, 'VALIDATION_ERROR');
  assert.equal(called, false);
});

test('供应商失败返回可重试的友好错误', async () => {
  const response = await resolveCity(
    { latitude: 31, longitude: 121 },
    { resolve: async () => { throw new Error('provider secret'); } },
    'req_provider',
  );
  assert.deepEqual(response, {
    error: { code: 'EXTERNAL_SERVICE_ERROR', message: '暂时无法识别所在城市，请稍后重试', retryable: true },
    requestId: 'req_provider',
  });
});
