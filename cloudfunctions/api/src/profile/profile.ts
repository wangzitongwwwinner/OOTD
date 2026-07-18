import {
  failure,
  success,
  updateProfileRequestSchema,
  type ApiEnvelope,
  type Profile,
} from '../../../../packages/contracts/src/index.ts';

import type { UserRepository } from '../auth/user-repository.ts';
import type { TrustedIdentity } from '../context.ts';

export async function getProfile(
  identity: TrustedIdentity,
  repository: UserRepository,
  requestId: string,
): Promise<ApiEnvelope<Profile>> {
  try {
    const profile = await repository.findByWechatIdentity(identity);
    if (!profile) {
      return failure('NOT_FOUND', '用户资料不存在', false, requestId);
    }
    return success(profile, requestId);
  } catch {
    return failure('INTERNAL_ERROR', '资料暂时无法读取，请稍后重试', true, requestId);
  }
}

export async function updateProfile(
  body: unknown,
  identity: TrustedIdentity,
  repository: UserRepository,
  requestId: string,
  clock: () => Date = () => new Date(),
): Promise<ApiEnvelope<Profile>> {
  const parsed = updateProfileRequestSchema.safeParse(body);
  if (!parsed.success) {
    return failure('VALIDATION_ERROR', '请选择有效的体感偏好', false, requestId);
  }

  try {
    const result = await repository.updateFeelPreference({
      ...identity,
      ...parsed.data,
      now: clock().toISOString(),
    });
    if (result.status === 'updated') {
      return success(result.profile, requestId);
    }
    if (result.status === 'conflict') {
      return failure(
        'CONFLICT',
        '资料已在其他位置更新，请刷新后重试',
        true,
        requestId,
      );
    }
    return failure('NOT_FOUND', '用户资料不存在', false, requestId);
  } catch {
    return failure('INTERNAL_ERROR', '资料暂时无法更新，请稍后重试', true, requestId);
  }
}
