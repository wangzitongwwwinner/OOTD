import Taro from '@tarojs/taro';

import { taroSessionCache, type SessionCache } from './session-cache';
import {
  isAuthSession,
  type AuthSession,
  type WechatLoginRequest,
} from './types';

interface AuthServiceDependencies {
  call(body: WechatLoginRequest): Promise<unknown>;
  cache: SessionCache;
}

export function createAuthService({ call, cache }: AuthServiceDependencies) {
  return {
    async loginWithWechatAgreement(
      body: WechatLoginRequest,
    ): Promise<AuthSession> {
      let result: unknown;
      try {
        result = await call(body);
      } catch {
        throw new Error('网络连接失败，请稍后重试');
      }

      if (isFailureEnvelope(result)) {
        throw new Error(result.error.message);
      }
      if (!isSuccessEnvelope(result) || !isAuthSession(result.data)) {
        throw new Error('登录响应异常，请稍后重试');
      }
      cache.save(result.data);
      return result.data;
    },
    restoreAuthSession: () => cache.restore(),
    clearAuthSession: () => cache.clear(),
  };
}

export const authService = createAuthService({
  async call(body) {
    const response = await Taro.cloud.callFunction({
      name: 'api',
      data: { method: 'POST', path: '/v1/auth/wechat/login', body },
    });
    return response.result;
  },
  cache: taroSessionCache,
});

export const loginWithWechatAgreement = authService.loginWithWechatAgreement;
export const restoreAuthSession = authService.restoreAuthSession;
export const clearAuthSession = authService.clearAuthSession;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSuccessEnvelope(
  value: unknown,
): value is { data: unknown; requestId: string } {
  return (
    isRecord(value) && typeof value.requestId === 'string' && 'data' in value
  );
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
