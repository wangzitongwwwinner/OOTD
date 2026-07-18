import assert from 'node:assert/strict';
import test from 'node:test';

import { trustedIdentityFromWxContext } from './context.ts';
import { createRequestContext, routeRequest } from './router.ts';

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
