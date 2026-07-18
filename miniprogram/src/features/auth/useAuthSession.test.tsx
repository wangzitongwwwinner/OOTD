import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAuthSession } from './useAuthSession';

describe('useAuthSession', () => {
  it('恢复缓存会话后进入已登录状态', async () => {
    const restored = {
      schemaVersion: 1 as const,
      userIsolationKey: 'user_1',
      authenticatedAt: '2026-07-18T02:00:00.000Z',
      expiresAt: '2026-07-25T02:00:00.000Z',
      user: {
        id: 'user_1',
        nickname: '微信用户',
        recentFeelPreference: 'comfortable' as const,
        createdAt: '2026-07-18T02:00:00.000Z',
        updatedAt: '2026-07-18T02:00:00.000Z',
        version: 1,
      },
    };
    const { result } = renderHook(() =>
      useAuthSession({
        restoreAuthSession: vi.fn(() => restored),
        loginWithWechatAgreement: vi.fn(),
        clearAuthSession: vi.fn(),
      }),
    );
    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    expect(result.current.session).toEqual(restored);
  });

  it('登录失败后恢复可重试的未登录状态', async () => {
    const { result } = renderHook(() =>
      useAuthSession({
        restoreAuthSession: vi.fn(() => undefined),
        loginWithWechatAgreement: vi
          .fn()
          .mockRejectedValue(new Error('网络连接失败，请稍后重试')),
        clearAuthSession: vi.fn(),
      }),
    );
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    await act(async () => {
      await result.current.login({
        userAgreementVersion: 'v1',
        privacyPolicyVersion: 'v1',
        acceptedAt: new Date().toISOString(),
      });
    });
    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.error).toBe('网络连接失败，请稍后重试');
  });
});
