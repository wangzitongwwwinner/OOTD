import assert from 'node:assert/strict';
import test from 'node:test';

import {
  authSessionSchema,
  authUserSummarySchema,
  wechatLoginRequestSchema,
} from './auth.ts';

const agreement = {
  userAgreementVersion: '2026-07-18',
  privacyPolicyVersion: '2026-07-18',
  acceptedAt: '2026-07-18T12:00:00+08:00',
};

test('微信登录请求只接受协议版本和确认时间', () => {
  assert.deepEqual(wechatLoginRequestSchema.parse(agreement), agreement);

  for (const forgedIdentity of [
    { userId: 'forged-user' },
    { openId: 'forged-open-id' },
    { code: 'client-code' },
  ]) {
    assert.equal(
      wechatLoginRequestSchema.safeParse({ ...agreement, ...forgedIdentity }).success,
      false,
    );
  }
});

test('微信登录请求拒绝缺失协议和无效确认时间', () => {
  assert.equal(
    wechatLoginRequestSchema.safeParse({ ...agreement, userAgreementVersion: '' }).success,
    false,
  );
  assert.equal(
    wechatLoginRequestSchema.safeParse({ ...agreement, acceptedAt: 'not-a-date' }).success,
    false,
  );
});

test('公开用户摘要不允许返回微信内部标识', () => {
  const user = {
    id: 'user_001',
    nickname: '微信用户',
    recentFeelPreference: 'comfortable',
    createdAt: '2026-07-18T12:00:00+08:00',
    updatedAt: '2026-07-18T12:00:00+08:00',
    version: 1,
  };

  assert.deepEqual(authUserSummarySchema.parse(user), user);
  assert.equal(
    authUserSummarySchema.safeParse({ ...user, wechatOpenId: 'must-not-leak' }).success,
    false,
  );
});

test('会话快照包含版本、用户隔离键和有效期', () => {
  const session = {
    schemaVersion: 1,
    userIsolationKey: 'user_001',
    authenticatedAt: '2026-07-18T12:00:00+08:00',
    expiresAt: '2026-07-19T12:00:00+08:00',
    user: {
      id: 'user_001',
      nickname: '微信用户',
      recentFeelPreference: 'comfortable',
      createdAt: '2026-07-18T12:00:00+08:00',
      updatedAt: '2026-07-18T12:00:00+08:00',
      version: 1,
    },
  };

  assert.deepEqual(authSessionSchema.parse(session), session);
  assert.equal(
    authSessionSchema.safeParse({ ...session, userIsolationKey: 'another-user' }).success,
    false,
  );
});
