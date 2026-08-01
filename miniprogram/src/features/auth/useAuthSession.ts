import { useCallback, useEffect, useRef, useState } from 'react';

import { authService } from './auth-service';
import type { AuthSession, AuthUserSummary, WechatLoginRequest } from './types';

export type AuthService = Omit<typeof authService, 'saveAuthSession'> & {
  saveAuthSession?(session: AuthSession): void;
};
export type AuthStatus =
  'restoring' | 'unauthenticated' | 'authenticating' | 'authenticated';

export function useAuthSession(service: AuthService = authService) {
  const serviceRef = useRef(service);
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [session, setSession] = useState<AuthSession>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const restored = serviceRef.current.restoreAuthSession();
    setSession(restored);
    setStatus(restored ? 'authenticated' : 'unauthenticated');
  }, []);

  const login = useCallback(async (agreement: WechatLoginRequest) => {
    setStatus('authenticating');
    setError(undefined);
    try {
      const authenticated =
        await serviceRef.current.loginWithWechatAgreement(agreement);
      setSession(authenticated);
      setStatus('authenticated');
    } catch (cause) {
      setSession(undefined);
      setStatus('unauthenticated');
      setError(cause instanceof Error ? cause.message : '登录失败，请稍后重试');
    }
  }, []);

  const logout = useCallback(() => {
    serviceRef.current.clearAuthSession();
    setSession(undefined);
    setError(undefined);
    setStatus('unauthenticated');
  }, []);

  const updateUser = useCallback((user: AuthUserSummary) => {
    setSession((current) => {
      if (!current) return current;
      const updated = { ...current, user };
      serviceRef.current.saveAuthSession?.(updated);
      return updated;
    });
  }, []);

  return { status, session, error, login, logout, updateUser };
}
