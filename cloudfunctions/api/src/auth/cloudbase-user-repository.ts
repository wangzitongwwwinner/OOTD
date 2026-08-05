import { randomUUID } from 'node:crypto';

import type { Db } from '@cloudbase/database';

import {
  authUserSummarySchema,
  type AuthUserSummary,
  type Profile,
} from '../../../../packages/contracts/src/index.ts';
import { createDefaultNickname, needsDefaultNicknameUpgrade } from './default-profile.ts';
import type {
  FindOrCreateWechatUserInput,
  UserRepository,
} from './user-repository.ts';

interface StoredUser extends AuthUserSummary {
  _id?: string;
  wechatOpenId: string;
  wechatAppId: string;
}

export class CloudBaseUserRepository implements UserRepository {
  constructor(private readonly database: Db) {}

  async findOrCreateByWechatIdentity(
    input: FindOrCreateWechatUserInput,
  ): Promise<AuthUserSummary> {
    const users = this.database.collection('users');
    const existing = await users
      .where({ wechatOpenId: input.openId, wechatAppId: input.appId })
      .limit(1)
      .get();
    const stored = existing.data[0] as StoredUser | undefined;

    if (stored) {
      const nickname = needsDefaultNicknameUpgrade(stored.nickname)
        ? createDefaultNickname()
        : stored.nickname;
      await users.doc(stored._id ?? stored.id).update({
        latestAgreement: input.agreement,
        nickname,
        updatedAt: input.now,
        version: stored.version + 1,
      });
      return toPublicUser({
        ...stored,
        nickname,
        updatedAt: input.now,
        version: stored.version + 1,
      });
    }

    const id = `user_${randomUUID()}`;
    const created: StoredUser = {
      id,
      wechatOpenId: input.openId,
      wechatAppId: input.appId,
      nickname: createDefaultNickname(),
      recentFeelPreference: 'comfortable',
      latestAgreement: input.agreement,
      createdAt: input.now,
      updatedAt: input.now,
      version: 1,
    } as StoredUser & { latestAgreement: typeof input.agreement };
    await users.add(created);
    return toPublicUser(created);
  }

  async findByWechatIdentity(input: {
    openId: string;
    appId: string;
  }): Promise<Profile | undefined> {
    const result = await this.database.collection('users').where({
      wechatOpenId: input.openId,
      wechatAppId: input.appId,
    }).limit(1).get();
    const stored = result.data[0] as StoredUser | undefined;
    return stored ? toPublicUser(stored) : undefined;
  }

  async updateFeelPreference(
    input: Parameters<UserRepository['updateFeelPreference']>[0],
  ): ReturnType<UserRepository['updateFeelPreference']> {
    const users = this.database.collection('users');
    const matching = await users.where({
      wechatOpenId: input.openId,
      wechatAppId: input.appId,
    }).limit(1).get();
    const stored = matching.data[0] as StoredUser | undefined;
    if (!stored) return { status: 'not_found' };
    if (stored.version !== input.expectedVersion) return { status: 'conflict' };

    const next = {
      ...stored,
      recentFeelPreference: input.recentFeelPreference,
      updatedAt: input.now,
      version: stored.version + 1,
    };
    const result = await users.where({
      _id: stored._id,
      version: input.expectedVersion,
    }).update({
      recentFeelPreference: next.recentFeelPreference,
      updatedAt: next.updatedAt,
      version: next.version,
    });
    if (result.updated !== 1) return { status: 'conflict' };
    return { status: 'updated', profile: toPublicUser(next) };
  }

  async updateProfile(
    input: Parameters<NonNullable<UserRepository['updateProfile']>>[0],
  ): ReturnType<NonNullable<UserRepository['updateProfile']>> {
    const users = this.database.collection('users');
    const matching = await users.where({
      wechatOpenId: input.openId,
      wechatAppId: input.appId,
    }).limit(1).get();
    const stored = matching.data[0] as StoredUser | undefined;
    if (!stored) return { status: 'not_found' };
    if (stored.version !== input.expectedVersion) return { status: 'conflict' };

    const patch = {
      ...(input.nickname !== undefined ? { nickname: input.nickname } : {}),
      ...(input.avatarFileId !== undefined
        ? { avatarFileId: input.avatarFileId }
        : {}),
      ...(input.recentFeelPreference !== undefined
        ? { recentFeelPreference: input.recentFeelPreference }
        : {}),
      updatedAt: input.now,
      version: stored.version + 1,
    };
    const result = await users.where({
      _id: stored._id,
      version: input.expectedVersion,
    }).update(patch);
    if (result.updated !== 1) return { status: 'conflict' };
    return {
      status: 'updated',
      profile: toPublicUser({ ...stored, ...patch }),
    };
  }
}

function toPublicUser(stored: StoredUser): AuthUserSummary {
  return authUserSummarySchema.parse({
    id: stored.id,
    nickname: stored.nickname,
    ...(stored.avatarFileId ? { avatarFileId: stored.avatarFileId } : {}),
    recentFeelPreference: stored.recentFeelPreference,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
    version: stored.version,
  });
}
