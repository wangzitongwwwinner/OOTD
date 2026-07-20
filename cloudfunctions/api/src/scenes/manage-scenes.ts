import {
  createSceneRequestSchema,
  failure,
  success,
  updateSceneRequestSchema,
  type ApiEnvelope,
  type Scene,
} from '../../../../packages/contracts/src/index.ts';

import type { TrustedIdentity } from '../context.ts';
import type { SceneRepository } from './scene-repository.ts';

export async function createScene(
  body: unknown,
  identity: TrustedIdentity,
  repository: SceneRepository,
  requestId: string,
): Promise<ApiEnvelope<Scene>> {
  const parsed = createSceneRequestSchema.safeParse(body);
  if (!parsed.success) {
    return failure('VALIDATION_ERROR', '请填写完整的场景信息', false, requestId);
  }

  try {
    const scene = await repository.create(parsed.data, identity);
    return success(scene, requestId);
  } catch {
    return failure('INTERNAL_ERROR', '场景添加失败，请稍后重试', true, requestId);
  }
}

export async function updateScene(
  id: string,
  body: unknown,
  identity: TrustedIdentity,
  repository: SceneRepository,
  requestId: string,
): Promise<ApiEnvelope<Scene>> {
  const parsed = updateSceneRequestSchema.safeParse(body);
  if (!parsed.success) {
    return failure('VALIDATION_ERROR', '请填写完整的场景信息', false, requestId);
  }

  try {
    const existing = await repository.findById(id, identity);
    if (!existing) {
      return failure('NOT_FOUND', '场景不存在或已删除', false, requestId);
    }

    const result = await repository.update(id, parsed.data, identity);
    if (result.status === 'updated') {
      return success(result.scene, requestId);
    }
    if (result.status === 'conflict') {
      return failure('CONFLICT', '场景已被修改，请刷新后重试', true, requestId);
    }
    return failure('NOT_FOUND', '场景不存在或已删除', false, requestId);
  } catch {
    return failure('INTERNAL_ERROR', '场景编辑失败，请稍后重试', true, requestId);
  }
}
