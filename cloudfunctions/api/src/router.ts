import {
  failure,
  success,
  type ApiEnvelope,
} from '../../../packages/contracts/src/index.ts';

import type { RequestContext, TrustedIdentity } from './context.ts';

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

export function routeRequest(
  event: RequestEvent,
  identity: TrustedIdentity,
  requestId: string,
): ApiEnvelope<unknown> {
  createRequestContext(event, identity, requestId);

  if (event.method === 'GET' && event.path === '/health') {
    return success({ status: 'ok' }, requestId);
  }

  return failure(
    'NOT_FOUND',
    '请求的接口不存在',
    false,
    requestId,
  );
}
