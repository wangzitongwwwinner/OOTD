import Taro from '@tarojs/taro';

import { isAuthSession, type AuthSession } from './types';

const SESSION_KEY = 'chuanyiyoushu.auth.session';

export interface SessionStorage {
  get(key: string): unknown;
  set(key: string, value: unknown): unknown;
  delete(key: string): unknown;
}

export interface SessionCache {
  save(session: AuthSession): void;
  restore(): AuthSession | undefined;
  clear(): void;
}

export function createSessionCache(
  storage: SessionStorage,
  clock: () => Date = () => new Date(),
): SessionCache {
  return {
    save(session) {
      if (!isAuthSession(session)) throw new Error('Invalid auth session');
      storage.set(SESSION_KEY, session);
    },
    restore() {
      const stored = storage.get(SESSION_KEY);
      if (
        !isAuthSession(stored) ||
        Date.parse(stored.expiresAt) <= clock().getTime()
      ) {
        storage.delete(SESSION_KEY);
        return undefined;
      }
      return stored;
    },
    clear() {
      storage.delete(SESSION_KEY);
    },
  };
}

export const taroSessionCache = createSessionCache({
  get: (key) => Taro.getStorageSync(key),
  set: (key, value) => Taro.setStorageSync(key, value),
  delete: (key) => Taro.removeStorageSync(key),
});
