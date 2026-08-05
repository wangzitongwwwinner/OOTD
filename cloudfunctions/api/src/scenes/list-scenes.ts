import {
  failure,
  sceneListSchema,
  success,
  type ApiEnvelope,
  type SceneList,
} from '../../../../packages/contracts/src/index.ts';
import type { TrustedIdentity } from '../context.ts';
import type { SceneRepository } from './scene-repository.ts';

export async function listScenes(
  identity: TrustedIdentity,
  repository: SceneRepository,
  requestId: string,
): Promise<ApiEnvelope<SceneList>> {
  try {
    const custom = await repository.findCustomByIdentity(identity);
    return success(
      sceneListSchema.parse({ items: custom }),
      requestId,
    );
  } catch {
    return failure(
      'INTERNAL_ERROR',
      '场景加载失败，请稍后重试',
      true,
      requestId,
    );
  }
}
