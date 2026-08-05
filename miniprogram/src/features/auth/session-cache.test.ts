import { describe, expect, it, vi } from 'vitest';

import type { AuthSession } from './types';
import { createSessionCache } from './session-cache';

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

describe('会话缓存', () => {
  it('保存并恢复未过期的版本化会话', () => {
    const storage = new Map<string, unknown>();
    const cache = createSessionCache(
      storage,
      () => new Date('2026-07-19T00:00:00Z'),
    );
    cache.save(session);
    expect(cache.restore()).toEqual(session);
  });

  it('过期或损坏时清理缓存', () => {
    const storage = new Map<string, unknown>([
      ['chuanyiyoushu.auth.session', session],
    ]);
    const remove = vi.spyOn(storage, 'delete');
    const cache = createSessionCache(
      storage,
      () => new Date('2026-07-26T00:00:00Z'),
    );
    expect(cache.restore()).toBeUndefined();
    expect(remove).toHaveBeenCalled();
  });
});
