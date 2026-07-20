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
    await this.ensurePresetsSeeded();

    const users = await this.database
      .collection('users')
      .where({ wechatOpenId: identity.openId, wechatAppId: identity.appId })
      .limit(1)
      .get();
    const user = users.data[0] as { id?: unknown } | undefined;
    if (!user || typeof user.id !== 'string') return [];

    const [customResult, presetResult] = await Promise.all([
      this.database
        .collection('scenes')
        .where({ userId: user.id, isPreset: false })
        .orderBy('updatedAt', 'desc')
        .limit(200)
        .get(),
      this.database
        .collection('scenes')
        .where({ isPreset: true })
        .limit(20)
        .get(),
    ]);
    return [
      ...presetResult.data.map((stored: unknown) => toPublicScene(stored)),
      ...customResult.data.map((stored: unknown) => toPublicScene(stored)),
    ];
  }

  async create(input: SceneCreateInput, identity: TrustedIdentity): Promise<Scene> {
    const validation = createSceneRequestSchema.safeParse(input);
    if (!validation.success) {
      throw new Error('场景输入校验失败，请检查后重试');
    }

    const userId = await this.resolveUserId(identity);
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
    await this.ensurePresetsSeeded();

    const userId = await this.resolveUserId(identity);
    if (!userId) return undefined;

    // Query by id first, then filter by userId OR isPreset
    const result = await this.database
      .collection('scenes')
      .where({ id })
      .limit(1)
      .get();

    const stored = result.data[0];
    if (!stored) return undefined;
    const s = stored as Record<string, unknown>;
    // Allow access if it's a preset OR belongs to this user
    if (s.isPreset === true || s.userId === userId) {
      return toPublicScene(stored);
    }
    return undefined;
  }

  async update(
    id: string,
    input: SceneUpdateInput,
    identity: TrustedIdentity,
  ): Promise<UpdateSceneResult> {
    await this.ensurePresetsSeeded();

    const validation = updateSceneRequestSchema.safeParse(input);
    if (!validation.success) {
      throw new Error('场景输入校验失败，请检查后重试');
    }

    const userId = await this.resolveUserId(identity);

    // Query by id first, then verify ownership
    const result = await this.database
      .collection('scenes')
      .where({ id })
      .limit(1)
      .get();

    const stored = result.data[0] as Record<string, unknown> | undefined;
    if (!stored) return { status: 'not_found' };

    // Only the owner (or a preset that anyone can edit) can update
    if (stored.isPreset !== true && stored.userId !== userId) {
      return { status: 'not_found' };
    }

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

    const query = stored.isPreset === true
      ? this.database.collection('scenes').where({ id })
      : this.database.collection('scenes').where({ id, userId });

    await query.update(updated);

    const fresh = await this.findById(id, identity);
    if (!fresh) return { status: 'not_found' };
    return { status: 'updated', scene: fresh };
  }

  async delete(id: string, identity: TrustedIdentity): Promise<DeleteSceneResult> {
    await this.ensurePresetsSeeded();
    const userId = await this.resolveUserId(identity);

    const result = await this.database
      .collection('scenes')
      .where({ id })
      .limit(1)
      .get();

    const stored = result.data[0] as Record<string, unknown> | undefined;
    if (!stored) return { status: 'not_found' };

    if (stored.isPreset !== true && stored.userId !== userId) {
      return { status: 'not_found' };
    }

    await this.database
      .collection('scenes')
      .where({ id })
      .remove();

    return { status: 'deleted' };
  }

  private async ensurePresetsSeeded(): Promise<void> {
    try {
      const existing = await this.database
        .collection('scenes')
        .where({ isPreset: true })
        .limit(1)
        .get();
      if (existing.data.length > 0) return;

      for (const preset of PRESET_SCENES) {
        const doc: Record<string, unknown> = { ...preset };
        await this.database.collection('scenes').add(doc);
      }
    } catch {
      // Seed failure is non-fatal; presets will be seeded on next attempt
    }
  }

  private async resolveUserId(identity: TrustedIdentity): Promise<string | undefined> {
    const users = await this.database
      .collection('users')
      .where({ wechatOpenId: identity.openId, wechatAppId: identity.appId })
      .limit(1)
      .get();
    const user = users.data[0] as { id?: unknown } | undefined;
    return user && typeof user.id === 'string' ? user.id : undefined;
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
