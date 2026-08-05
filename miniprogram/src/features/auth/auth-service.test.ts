import { describe, expect, it, vi } from 'vitest';

import { createAuthService } from './auth-service';
import type { AuthSession } from './types';

const session: AuthSession = {
  schemaVersion: 1,
  userIsolationKey: 'user_1',
  authenticatedAt: '2026-07-18T02:00:00.000Z',
  expiresAt: '2026-07-25T02:00:00.000Z',
  user: {
    id: 'user_1',
    nickname: '微信用户',
    recentFeelPreference: 'comfortable',
    createdAt: '2026-07-18T02:00:00.000Z',
    updatedAt: '2026-07-18T02:00:00.000Z',
    version: 1,
  },
};

describe('认证服务', () => {
  it('登录成功后校验并保存会话', async () => {
    const save = vi.fn();
    const service = createAuthService({
      call: vi.fn().mockResolvedValue({ data: session, requestId: 'req_1' }),
      cache: { save, restore: vi.fn(), clear: vi.fn() },
    });
    await expect(
      service.loginWithWechatAgreement({
        userAgreementVersion: '2026-07-18',
        privacyPolicyVersion: '2026-07-18',
        acceptedAt: '2026-07-18T02:00:00.000Z',
      }),
    ).resolves.toEqual(session);
    expect(save).toHaveBeenCalledWith(session);
  });

  it('网络失败时不保存会话并返回可理解错误', async () => {
    const save = vi.fn();
    const service = createAuthService({
      call: vi.fn().mockRejectedValue(new Error('network detail')),
      cache: { save, restore: vi.fn(), clear: vi.fn() },
    });
    await expect(
      service.loginWithWechatAgreement({
        userAgreementVersion: 'v1',
        privacyPolicyVersion: 'v1',
        acceptedAt: '2026-07-18T02:00:00.000Z',
      }),
    ).rejects.toThrow('网络连接失败，请稍后重试');
    expect(save).not.toHaveBeenCalled();
  });

  it('恢复无效会话时返回未登录', () => {
    const service = createAuthService({
      call: vi.fn(),
      cache: { save: vi.fn(), restore: vi.fn(() => undefined), clear: vi.fn() },
    });
    expect(service.restoreAuthSession()).toBeUndefined();
  });
});
