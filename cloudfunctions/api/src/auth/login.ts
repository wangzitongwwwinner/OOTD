import {
  authSessionSchema,
  failure,
  success,
  wechatLoginRequestSchema,
  type ApiEnvelope,
  type AuthSession,
} from '../../../../packages/contracts/src/index.ts';

import type { TrustedIdentity } from '../context.ts';
import type { UserRepository } from './user-repository.ts';

const SESSION_DURATION_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;

export async function loginWithWechat(
  body: unknown,
  identity: TrustedIdentity,
  repository: UserRepository,
  requestId: string,
  clock: () => Date = () => new Date(),
): Promise<ApiEnvelope<AuthSession>> {
  const parsed = wechatLoginRequestSchema.safeParse(body);
  if (!parsed.success) {
    return failure(
      'VALIDATION_ERROR',
      '请先阅读并同意用户协议和隐私政策',
      false,
      requestId,
    );
  }

  const now = clock();
  const nowIso = now.toISOString();

  try {
    const user = await repository.findOrCreateByWechatIdentity({
      openId: identity.openId,
      appId: identity.appId,
      agreement: parsed.data,
      now: nowIso,
    });
    const session = authSessionSchema.parse({
      schemaVersion: 1,
      userIsolationKey: user.id,
      authenticatedAt: nowIso,
      expiresAt: new Date(
        now.getTime() + SESSION_DURATION_MILLISECONDS,
      ).toISOString(),
      user,
    });
    return success(session, requestId);
  } catch {
    return failure(
      'INTERNAL_ERROR',
      '登录暂时不可用，请稍后重试',
      true,
      requestId,
    );
  }
}
