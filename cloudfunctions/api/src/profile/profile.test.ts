import assert from 'node:assert/strict';
import test from 'node:test';

import type { Profile } from '../../../../packages/contracts/src/index.ts';
import type { UserRepository } from '../auth/user-repository.ts';
import { getProfile, updateProfile } from './profile.ts';

const identity = { openId: 'trusted-open-id', appId: 'trusted-app-id' };
const profile: Profile = {
  id: 'user_1', nickname: '微信用户', recentFeelPreference: 'comfortable',
  createdAt: '2026-07-18T02:00:00.000Z', updatedAt: '2026-07-18T02:00:00.000Z', version: 1,
};

function repository(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    findOrCreateByWechatIdentity: async () => profile,
    findByWechatIdentity: async () => profile,
    updateFeelPreference: async () => ({ status: 'updated', profile: { ...profile, recentFeelPreference: 'cool', version: 2 } }),
    ...overrides,
  };
}

test('读取当前可信微信身份对应的公开资料', async () => {
  const response = await getProfile(identity, repository(), 'req_get');
  assert.deepEqual(response, { data: profile, requestId: 'req_get' });
});

test('合法更新使用可信身份和期望版本', async () => {
  let received: unknown;
  const response = await updateProfile(
    { recentFeelPreference: 'cool', expectedVersion: 1, userId: 'forged' },
    identity,
    repository({ updateFeelPreference: async (input) => {
      received = input;
      return { status: 'updated', profile: { ...profile, recentFeelPreference: 'cool', version: 2 } };
    }}),
    'req_patch',
  );
  assert.equal('error' in response, true, '严格契约应拒绝额外身份字段');
  assert.equal(received, undefined);
});

test('版本冲突返回可恢复的 CONFLICT', async () => {
  const response = await updateProfile(
    { recentFeelPreference: 'cold', expectedVersion: 1 }, identity,
    repository({ updateFeelPreference: async () => ({ status: 'conflict' }) }),
    'req_conflict',
  );
  assert.deepEqual(response, {
    error: { code: 'CONFLICT', message: '资料已在其他位置更新，请刷新后重试', retryable: true },
    requestId: 'req_conflict',
  });
});

test('用户不存在和非法枚举分别返回 NOT_FOUND 与 VALIDATION_ERROR', async () => {
  const missing = await getProfile(
    identity,
    repository({ findByWechatIdentity: async () => undefined }),
    'req_missing',
  );
  assert.equal('error' in missing && missing.error.code, 'NOT_FOUND');
  const invalid = await updateProfile(
    { recentFeelPreference: 'hot', expectedVersion: 1 }, identity, repository(), 'req_invalid',
  );
  assert.equal('error' in invalid && invalid.error.code, 'VALIDATION_ERROR');
});
