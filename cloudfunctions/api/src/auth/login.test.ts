import assert from 'node:assert/strict';
import test from 'node:test';

import type { AuthUserSummary } from '../../../../packages/contracts/src/index.ts';
import { loginWithWechat } from './login.ts';
import type {
  FindOrCreateWechatUserInput,
  UserRepository,
} from './user-repository.ts';

const now = new Date('2026-07-18T02:00:00.000Z');
const user: AuthUserSummary = {
  id: 'user_1',
  nickname: '微信用户',
  recentFeelPreference: 'comfortable',
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
  version: 1,
};

function repositoryWith(result: AuthUserSummary = user) {
  const calls: FindOrCreateWechatUserInput[] = [];
  const repository: Pick<UserRepository, 'findOrCreateByWechatIdentity'> = {
    async findOrCreateByWechatIdentity(input) {
      calls.push(input);
      return result;
    },
  };
  return { repository, calls };
}

test('协议字段完整时使用可信平台身份登录并返回公开会话', async () => {
  const { repository, calls } = repositoryWith();
  const response = await loginWithWechat(
    {
      userAgreementVersion: '2026-07-18',
      privacyPolicyVersion: '2026-07-18',
      acceptedAt: now.toISOString(),
    },
    { openId: 'trusted-open-id', appId: 'trusted-app-id' },
    repository,
    'req_login',
    () => now,
  );

  assert.equal('data' in response, true);
  if (!('data' in response)) return;
  assert.equal(response.data.user.id, 'user_1');
  assert.equal('wechatOpenId' in response.data.user, false);
  assert.equal(response.data.userIsolationKey, 'user_1');
  assert.deepEqual(calls, [
    {
      openId: 'trusted-open-id',
      appId: 'trusted-app-id',
      agreement: {
        userAgreementVersion: '2026-07-18',
        privacyPolicyVersion: '2026-07-18',
        acceptedAt: now.toISOString(),
      },
      now: now.toISOString(),
    },
  ]);
});

test('缺少协议确认时不访问用户仓储', async () => {
  const { repository, calls } = repositoryWith();
  const response = await loginWithWechat(
    {},
    { openId: 'trusted-open-id', appId: 'trusted-app-id' },
    repository,
    'req_invalid',
    () => now,
  );

  assert.deepEqual(response, {
    error: {
      code: 'VALIDATION_ERROR',
      message: '请先阅读并同意用户协议和隐私政策',
      retryable: false,
    },
    requestId: 'req_invalid',
  });
  assert.equal(calls.length, 0);
});

test('仓储异常返回可重试的内部错误且不泄露细节', async () => {
  const repository: Pick<UserRepository, 'findOrCreateByWechatIdentity'> = {
    async findOrCreateByWechatIdentity() {
      throw new Error('database credential and open-id');
    },
  };
  const response = await loginWithWechat(
    {
      userAgreementVersion: 'v1',
      privacyPolicyVersion: 'v1',
      acceptedAt: now.toISOString(),
    },
    { openId: 'trusted-open-id', appId: 'trusted-app-id' },
    repository,
    'req_failure',
    () => now,
  );

  assert.deepEqual(response, {
    error: {
      code: 'INTERNAL_ERROR',
      message: '登录暂时不可用，请稍后重试',
      retryable: true,
    },
    requestId: 'req_failure',
  });
});
