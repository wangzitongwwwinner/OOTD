import Taro from '@tarojs/taro';

import type { AuthUserSummary } from '../auth/types';

export type FeelPreference = AuthUserSummary['recentFeelPreference'];
export type Profile = AuthUserSummary;

interface ProfileRequest {
  method: 'GET' | 'PATCH';
  path: '/v1/profile';
  body?: { recentFeelPreference: FeelPreference; expectedVersion: number };
}

type Call = (request: ProfileRequest) => Promise<unknown>;

export function createProfileService(call: Call) {
  async function request(payload: ProfileRequest): Promise<Profile> {
    let result: unknown;
    try {
      result = await call(payload);
    } catch {
      throw new Error('网络连接失败，请稍后重试');
    }
    if (isFailureEnvelope(result)) throw new Error(result.error.message);
    if (!isSuccessEnvelope(result) || !isProfile(result.data)) {
      throw new Error('资料响应异常，请稍后重试');
    }
    return result.data;
  }

  return {
    get: () => request({ method: 'GET', path: '/v1/profile' }),
    updateFeel: (
      recentFeelPreference: FeelPreference,
      expectedVersion: number,
    ) =>
      request({
        method: 'PATCH',
        path: '/v1/profile',
        body: { recentFeelPreference, expectedVersion },
      }),
  };
}

export const profileService = createProfileService(async (data) => {
  const response = await Taro.cloud.callFunction({ name: 'api', data });
  return response.result;
});

function isProfile(value: unknown): value is Profile {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.nickname === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string' &&
    typeof value.version === 'number' &&
    ['cold', 'comfortable', 'stuffy', 'cool'].includes(
      String(value.recentFeelPreference),
    )
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSuccessEnvelope(value: unknown): value is { data: unknown } {
  return isRecord(value) && 'data' in value;
}

function isFailureEnvelope(
  value: unknown,
): value is { error: { message: string } } {
  return (
    isRecord(value) &&
    isRecord(value.error) &&
    typeof value.error.message === 'string'
  );
}
