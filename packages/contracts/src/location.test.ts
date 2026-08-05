import assert from 'node:assert/strict';
import test from 'node:test';

import { cityLocationSchema, resolveCityRequestSchema } from './location.ts';

test('城市解析请求只接受有效经纬度', () => {
  assert.deepEqual(resolveCityRequestSchema.parse({ latitude: 31.2304, longitude: 121.4737 }), {
    latitude: 31.2304,
    longitude: 121.4737,
  });
  assert.equal(resolveCityRequestSchema.safeParse({ latitude: 91, longitude: 0 }).success, false);
  assert.equal(resolveCityRequestSchema.safeParse({ latitude: 31, longitude: 181 }).success, false);
});

test('城市解析请求拒绝客户端身份和额外字段', () => {
  assert.equal(resolveCityRequestSchema.safeParse({
    latitude: 31.2304, longitude: 121.4737, userId: 'forged',
  }).success, false);
});

test('城市结果仅包含城市级公开信息', () => {
  assert.deepEqual(cityLocationSchema.parse({ cityCode: '101020100', cityName: '上海' }), {
    cityCode: '101020100', cityName: '上海',
  });
  assert.equal(cityLocationSchema.safeParse({
    cityCode: '101020100', cityName: '上海', latitude: 31.2304,
  }).success, false);
});
