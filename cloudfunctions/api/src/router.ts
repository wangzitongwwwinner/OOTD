import {
  failure,
  success,
  type ApiEnvelope,
} from '../../../packages/contracts/src/index.ts';

import type { RequestContext, TrustedIdentity } from './context.ts';
import { loginWithWechat } from './auth/login.ts';
import type { UserRepository } from './auth/user-repository.ts';

interface RequestEvent {
  method?: unknown;
  path?: unknown;
  [key: string]: unknown;
}

export function createRequestContext(
  _event: RequestEvent,
  identity: TrustedIdentity,
  requestId: string,
): RequestContext {
  return { requestId, identity };
}

export async function routeRequest(
  event: RequestEvent,
  identity: TrustedIdentity,
  requestId: string,
  userRepository?: UserRepository,
): Promise<ApiEnvelope<unknown>> {
  createRequestContext(event, identity, requestId);

  if (event.method === 'GET' && event.path === '/health') {
    return success({ status: 'ok' }, requestId);
  }

  if (event.method === 'POST' && event.path === '/v1/auth/wechat/login') {
    if (!userRepository) {
      return failure(
        'INTERNAL_ERROR',
        '登录暂时不可用，请稍后重试',
        true,
        requestId,
      );
    }
    return loginWithWechat(event.body, identity, userRepository, requestId);
  }

  return failure(
    'NOT_FOUND',
    '请求的接口不存在',
    false,
    requestId,
  );
}
