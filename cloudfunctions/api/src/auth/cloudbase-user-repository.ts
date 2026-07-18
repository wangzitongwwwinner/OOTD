import { randomUUID } from 'node:crypto';

import type { Db } from '@cloudbase/database';

import {
  authUserSummarySchema,
  type AuthUserSummary,
} from '../../../../packages/contracts/src/index.ts';
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
      .where({ wechatOpenId: input.openId })
      .limit(1)
      .get();
    const stored = existing.data[0] as StoredUser | undefined;

    if (stored) {
      await users.doc(stored._id ?? stored.id).update({
        latestAgreement: input.agreement,
        updatedAt: input.now,
        version: stored.version + 1,
      });
      return toPublicUser({
        ...stored,
        updatedAt: input.now,
        version: stored.version + 1,
      });
    }

    const id = `user_${randomUUID()}`;
    const created: StoredUser = {
      id,
      wechatOpenId: input.openId,
      wechatAppId: input.appId,
      nickname: '微信用户',
      recentFeelPreference: 'comfortable',
      latestAgreement: input.agreement,
      createdAt: input.now,
      updatedAt: input.now,
      version: 1,
    } as StoredUser & { latestAgreement: typeof input.agreement };
    await users.add(created);
    return toPublicUser(created);
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
