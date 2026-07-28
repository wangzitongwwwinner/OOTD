import assert from 'node:assert/strict';
import test from 'node:test';

import { profileSchema, updateProfileRequestSchema } from './profile.ts';

const profile = {
  id: 'user_1',
  nickname: '微信用户',
  recentFeelPreference: 'comfortable',
  createdAt: '2026-07-18T02:00:00.000Z',
  updatedAt: '2026-07-18T02:00:00.000Z',
  version: 1,
};

test('公开资料不允许包含微信内部身份字段', () => {
  assert.deepEqual(profileSchema.parse(profile), profile);
  assert.equal(
    profileSchema.safeParse({ ...profile, wechatOpenId: 'private-open-id' }).success,
    false,
  );
});

test('资料更新接受昵称、头像或稳定体感枚举和当前正整数版本', () => {
  assert.deepEqual(
    updateProfileRequestSchema.parse({
      nickname: '梓桐',
      avatarFileId: 'cloud://avatar.png',
      expectedVersion: 2,
    }),
    {
      nickname: '梓桐',
      avatarFileId: 'cloud://avatar.png',
      expectedVersion: 2,
    },
  );
  assert.equal(
    updateProfileRequestSchema.safeParse({ expectedVersion: 1 }).success,
    false,
  );
  assert.equal(
    updateProfileRequestSchema.safeParse({
      recentFeelPreference: 'hot',
      expectedVersion: 0,
    }).success,
    false,
  );
});

test('资料更新拒绝客户端身份和额外字段', () => {
  for (const identity of [
    { userId: 'forged-user' },
    { openId: 'forged-open-id' },
    { wechatOpenId: 'forged-open-id' },
  ]) {
    assert.equal(
      updateProfileRequestSchema.safeParse({
        recentFeelPreference: 'cold',
        expectedVersion: 1,
        ...identity,
      }).success,
      false,
    );
  }
});
