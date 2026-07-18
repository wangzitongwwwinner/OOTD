import { useCallback, useEffect, useRef, useState } from 'react';

import { authService } from './auth-service';
import type { AuthSession, WechatLoginRequest } from './types';

type AuthService = typeof authService;
type AuthStatus =
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

  return { status, session, error, login, logout };
}
