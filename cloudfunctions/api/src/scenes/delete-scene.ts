import { failure, success, type ApiEnvelope } from '../../../../packages/contracts/src/index.ts';

import type { TrustedIdentity } from '../context.ts';
import type { SceneRepository } from './scene-repository.ts';

export async function deleteScene(
  id: string,
  identity: TrustedIdentity,
  repository: SceneRepository,
  requestId: string,
): Promise<ApiEnvelope<null>> {
  try {
    const result = await repository.delete(id, identity);
    if (result.status === 'deleted') {
      return success(null, requestId);
    }
    return failure('NOT_FOUND', '场景不存在或已删除', false, requestId);
  } catch {
    return failure('INTERNAL_ERROR', '场景删除失败，请稍后重试', true, requestId);
  }
}
