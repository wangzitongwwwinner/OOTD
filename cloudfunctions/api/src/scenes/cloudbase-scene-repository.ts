import type { Db } from '@cloudbase/database';

import {
  createSceneRequestSchema,
  sceneSchema,
  updateSceneRequestSchema,
  type Scene,
} from '../../../../packages/contracts/src/index.ts';
import type { TrustedIdentity } from '../context.ts';
import { PRESET_SCENES } from './presets.ts';
import type {
  DeleteSceneResult,
  SceneCreateInput,
  SceneRepository,
  SceneUpdateInput,
  UpdateSceneResult,
} from './scene-repository.ts';

export class CloudBaseSceneRepository implements SceneRepository {
  constructor(private readonly database: Db) {}

  async findCustomByIdentity(identity: TrustedIdentity): Promise<Scene[]> {
    const userId = await this.ensureUserExamplesInitialized(identity);
    if (!userId) return [];

    const result = await this.database
      .collection('scenes')
      .where({ userId })
      .orderBy('updatedAt', 'desc')
      .limit(200)
      .get();
    return result.data.map((stored: unknown) => toPublicScene(stored));
  }

  async create(input: SceneCreateInput, identity: TrustedIdentity): Promise<Scene> {
    const validation = createSceneRequestSchema.safeParse(input);
    if (!validation.success) {
      throw new Error('场景输入校验失败，请检查后重试');
    }

    const userId = await this.ensureUserExamplesInitialized(identity);
    if (!userId) throw new Error('用户不存在，请先登录');

    const id = this.generateId();
    const now = new Date().toISOString();
    const scene: Record<string, unknown> = {
      ...validation.data,
      id,
      userId,
      isPreset: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    await this.database.collection('scenes').add(scene);
    return toPublicScene(scene);
  }

  async findById(id: string, identity: TrustedIdentity): Promise<Scene | undefined> {
    const userId = await this.ensureUserExamplesInitialized(identity);
    if (!userId) return undefined;
    const stored = await this.findOwnedStoredScene(id, userId);
    return stored ? toPublicScene(stored) : undefined;
  }

  async update(
    id: string,
    input: SceneUpdateInput,
    identity: TrustedIdentity,
  ): Promise<UpdateSceneResult> {
    const validation = updateSceneRequestSchema.safeParse(input);
    if (!validation.success) {
      throw new Error('场景输入校验失败，请检查后重试');
    }

    const userId = await this.ensureUserExamplesInitialized(identity);
    if (!userId) return { status: 'not_found' };
    const stored = await this.findOwnedStoredScene(id, userId);
    if (!stored) return { status: 'not_found' };

    const currentVersion = stored.version as number;
    if (currentVersion !== input.expectedVersion) {
      return { status: 'conflict' };
    }

    const now = new Date().toISOString();
    const updated: Record<string, unknown> = {
      ...validation.data,
      expectedVersion: undefined,
      version: currentVersion + 1,
      updatedAt: now,
    };
    delete updated.expectedVersion;
    delete updated.userId;

    const storedId = String(stored.id);
    await this.database
      .collection('scenes')
      .where({ id: storedId, userId })
      .update(updated);

    const fresh = await this.findById(storedId, identity);
    if (!fresh) return { status: 'not_found' };
    return { status: 'updated', scene: fresh };
  }

  async delete(id: string, identity: TrustedIdentity): Promise<DeleteSceneResult> {
    const userId = await this.ensureUserExamplesInitialized(identity);
    if (!userId) return { status: 'not_found' };
    const stored = await this.findOwnedStoredScene(id, userId);
    if (!stored) return { status: 'not_found' };

    await this.database
      .collection('scenes')
      .where({ id: String(stored.id), userId })
      .remove();

    return { status: 'deleted' };
  }

  private async ensureUserExamplesInitialized(
    identity: TrustedIdentity,
  ): Promise<string | undefined> {
    const users = this.database.collection('users');
    const result = await users
      .where({ wechatOpenId: identity.openId, wechatAppId: identity.appId })
      .limit(1)
      .get();
    const user = result.data[0] as
      | { _id?: string; id?: unknown; sceneExamplesInitializedVersion?: unknown }
      | undefined;
    if (!user || typeof user.id !== 'string') return undefined;
    if (user.sceneExamplesInitializedVersion === 1) return user.id;

    const scenes = this.database.collection('scenes');
    for (const preset of PRESET_SCENES) {
      const existing = await scenes
        .where({ userId: user.id, sourcePresetId: preset.id })
        .limit(1)
        .get();
      if (existing.data.length) continue;
      const id = `${preset.id}__${user.id}`;
      await scenes.doc(id).set({
        ...preset,
        id,
        userId: user.id,
        sourcePresetId: preset.id,
      });
    }

    const marker = { sceneExamplesInitializedVersion: 1 };
    if (user._id) await users.doc(user._id).update(marker);
    else
      await users
        .where({ wechatOpenId: identity.openId, wechatAppId: identity.appId })
        .update(marker);
    return user.id;
  }

  private async findOwnedStoredScene(
    id: string,
    userId: string,
  ): Promise<Record<string, unknown> | undefined> {
    const scenes = this.database.collection('scenes');
    const direct = await scenes.where({ id, userId }).limit(1).get();
    const stored = direct.data[0] as Record<string, unknown> | undefined;
    if (stored) return stored;
    const presetCopy = await scenes
      .where({ sourcePresetId: id, userId })
      .limit(1)
      .get();
    return presetCopy.data[0] as Record<string, unknown> | undefined;
  }

  private generateId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = 'scene_';
    for (let i = 0; i < 16; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  }
}

function toPublicScene(stored: unknown): Scene {
  if (typeof stored !== 'object' || stored === null) {
    throw new Error('Invalid stored scene');
  }
  const { userId: _userId, _id: _databaseId, sourcePresetId: _sp, ...scene } = stored as Record<
    string,
    unknown
  >;
  void _userId;
  void _databaseId;
  void _sp;
  return sceneSchema.parse(scene);
}
