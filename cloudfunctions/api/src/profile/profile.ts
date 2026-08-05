import {
  failure,
  success,
  updateProfileRequestSchema,
  type ApiEnvelope,
  type Profile,
} from '../../../../packages/contracts/src/index.ts';

import type { UserRepository } from '../auth/user-repository.ts';
import type { TrustedIdentity } from '../context.ts';
import { recordMetricSafely } from '../metrics/cloudbase-metrics-recorder.ts';
import type { MetricsRecorder } from '../metrics/metrics-recorder.ts';

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
  metrics?: MetricsRecorder,
): Promise<ApiEnvelope<Profile>> {
  const parsed = updateProfileRequestSchema.safeParse(body);
  if (!parsed.success) {
    return failure('VALIDATION_ERROR', '请填写有效的资料内容', false, requestId);
  }

  try {
    const now = clock().toISOString();
    const result = repository.updateProfile
      ? await repository.updateProfile({
          ...identity,
          ...(parsed.data.nickname === undefined
            ? {}
            : { nickname: parsed.data.nickname }),
          ...(parsed.data.avatarFileId === undefined
            ? {}
            : { avatarFileId: parsed.data.avatarFileId }),
          ...(parsed.data.recentFeelPreference === undefined
            ? {}
            : {
                recentFeelPreference: parsed.data.recentFeelPreference,
              }),
          expectedVersion: parsed.data.expectedVersion,
          now,
        })
      : parsed.data.recentFeelPreference
        ? await repository.updateFeelPreference({
            ...identity,
            recentFeelPreference: parsed.data.recentFeelPreference,
            expectedVersion: parsed.data.expectedVersion,
            now,
          })
        : { status: 'not-found' as const };
    if (result.status === 'updated') {
      if (metrics && parsed.data.recentFeelPreference) {
        await recordMetricSafely(() =>
          metrics.markFirstSuccess(
            identity,
            'firstFeelPreferenceModifiedAt',
            clock().toISOString(),
          ),
        );
      }
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
