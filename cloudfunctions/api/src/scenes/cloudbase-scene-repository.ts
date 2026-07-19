import type { Db } from '@cloudbase/database';

import {
  sceneSchema,
  type Scene,
} from '../../../../packages/contracts/src/index.ts';
import type { TrustedIdentity } from '../context.ts';
import type { SceneRepository } from './scene-repository.ts';

export class CloudBaseSceneRepository implements SceneRepository {
  constructor(private readonly database: Db) {}

  async findCustomByIdentity(identity: TrustedIdentity): Promise<Scene[]> {
    const users = await this.database
      .collection('users')
      .where({ wechatOpenId: identity.openId, wechatAppId: identity.appId })
      .limit(1)
      .get();
    const user = users.data[0] as { id?: unknown } | undefined;
    if (!user || typeof user.id !== 'string') return [];

    const result = await this.database
      .collection('scenes')
      .where({ userId: user.id, isPreset: false })
      .orderBy('updatedAt', 'desc')
      .limit(200)
      .get();
    return result.data.map((stored: unknown) => toPublicScene(stored));
  }
}

function toPublicScene(stored: unknown): Scene {
  if (typeof stored !== 'object' || stored === null) {
    throw new Error('Invalid stored scene');
  }
  const { userId: _userId, _id: _databaseId, ...scene } = stored as Record<
    string,
    unknown
  >;
  void _userId;
  void _databaseId;
  return sceneSchema.parse(scene);
}
