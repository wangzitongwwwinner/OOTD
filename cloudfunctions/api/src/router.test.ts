import assert from 'node:assert/strict';
import test from 'node:test';

import type { Profile } from '../../../packages/contracts/src/index.ts';
import type { UserRepository } from './auth/user-repository.ts';
import { trustedIdentityFromWxContext } from './context.ts';
import type { CityResolver } from './location/city-resolver.ts';
import { createRequestContext, routeRequest } from './router.ts';
import type { SceneRepository } from './scenes/scene-repository.ts';
import type {
  WeatherCacheRepository,
  WeatherProvider,
} from './weather/weather-provider.ts';

const profile: Profile = {
  id: 'user_1',
  nickname: '微信用户',
  recentFeelPreference: 'comfortable',
  createdAt: '2026-07-18T02:00:00.000Z',
  updatedAt: '2026-07-18T02:00:00.000Z',
  version: 1,
};

const profileRepository: UserRepository = {
  findOrCreateByWechatIdentity: async () => profile,
  findByWechatIdentity: async () => profile,
  updateFeelPreference: async () => ({
    status: 'updated',
    profile: { ...profile, recentFeelPreference: 'cool', version: 2 },
  }),
};

const cityResolver: CityResolver = {
  resolve: async () => ({ cityCode: '101020100', cityName: '上海' }),
};

const weatherProvider: WeatherProvider = {
  getCurrent: async (input) => ({
    cityCode: input.cityCode,
    cityName: input.cityName,
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
  }),
};

const weatherCache: WeatherCacheRepository = {
  find: async () => undefined,
  save: async () => undefined,
};

const sceneRepository: SceneRepository = {
  findCustomByIdentity: async () => [],
};

test('GET /health 返回统一成功信封', async () => {
  const response = await routeRequest(
    { method: 'GET', path: '/health' },
    { openId: 'trusted-open-id', appId: 'trusted-app-id' },
    'req_health',
  );

  assert.deepEqual(response, {
    data: { status: 'ok' },
    requestId: 'req_health',
  });
});

test('GET 与 PATCH /v1/profile 接入资料用例', async () => {
  const identity = { openId: 'trusted-open-id', appId: 'trusted-app-id' };
  const getResponse = await routeRequest(
    { method: 'GET', path: '/v1/profile' },
    identity,
    'req_profile_get',
    profileRepository,
  );
  assert.deepEqual(getResponse, { data: profile, requestId: 'req_profile_get' });

  const patchResponse = await routeRequest(
    {
      method: 'PATCH',
      path: '/v1/profile',
      body: { recentFeelPreference: 'cool', expectedVersion: 1 },
    },
    identity,
    'req_profile_patch',
    profileRepository,
  );
  assert.deepEqual(patchResponse, {
    data: { ...profile, recentFeelPreference: 'cool', version: 2 },
    requestId: 'req_profile_patch',
  });
});

test('POST /v1/location/city 接入城市解析用例', async () => {
  const response = await routeRequest(
    {
      method: 'POST',
      path: '/v1/location/city',
      body: { latitude: 31.2304, longitude: 121.4737 },
    },
    { openId: 'trusted-open-id', appId: 'trusted-app-id' },
    'req_city',
    profileRepository,
    cityResolver,
  );
  assert.deepEqual(response, {
    data: { cityCode: '101020100', cityName: '上海' }, requestId: 'req_city',
  });
});

test('GET /v1/weather/current 接入天气用例', async () => {
  const response = await routeRequest(
    {
      method: 'GET',
      path: '/v1/weather/current',
      body: { cityCode: '101020100', cityName: '上海' },
    },
    { openId: 'trusted-open-id', appId: 'trusted-app-id' },
    'req_weather',
    profileRepository,
    cityResolver,
    { provider: weatherProvider, cache: weatherCache },
  );
  assert.deepEqual(response, {
    data: await weatherProvider.getCurrent({
      cityCode: '101020100',
      cityName: '上海',
    }),
    requestId: 'req_weather',
  });
});

test('GET /v1/scenes 接入可信身份场景查询', async () => {
  const response = await routeRequest(
    { method: 'GET', path: '/v1/scenes' },
    { openId: 'trusted-open-id', appId: 'trusted-app-id' },
    'req_scenes',
    profileRepository,
    cityResolver,
    { provider: weatherProvider, cache: weatherCache },
    sceneRepository,
  );
  assert.equal(
    'data' in response && response.data !== null &&
      typeof response.data === 'object' &&
      'items' in response.data &&
      Array.isArray(response.data.items),
    true,
  );
});

test('未知路由返回不可重试的 NOT_FOUND', async () => {
  const response = await routeRequest(
    { method: 'POST', path: '/v1/unknown' },
    { openId: 'trusted-open-id', appId: 'trusted-app-id' },
    'req_missing',
  );

  assert.deepEqual(response, {
    error: {
      code: 'NOT_FOUND',
      message: '请求的接口不存在',
      retryable: false,
    },
    requestId: 'req_missing',
  });
});

test('请求上下文只信任平台身份并忽略客户端伪造 userId', () => {
  const context = createRequestContext(
    {
      method: 'GET',
      path: '/health',
      userId: 'client-forged-user',
      openId: 'client-forged-open-id',
    },
    { openId: 'trusted-open-id', appId: 'trusted-app-id' },
    'req_context',
  );

  assert.deepEqual(context, {
    requestId: 'req_context',
    identity: {
      openId: 'trusted-open-id',
      appId: 'trusted-app-id',
    },
  });
  assert.equal('userId' in context, false);
});

test('平台身份缺少 OPENID 或 APPID 时拒绝建立可信身份', () => {
  assert.equal(
    trustedIdentityFromWxContext({ OPENID: '', APPID: 'trusted-app-id' }),
    undefined,
  );
  assert.equal(
    trustedIdentityFromWxContext({ OPENID: 'trusted-open-id' }),
    undefined,
  );
});
