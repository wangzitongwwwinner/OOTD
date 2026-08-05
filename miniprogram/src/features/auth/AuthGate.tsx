import Taro from '@tarojs/taro';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { LEGAL_VERSION_ID } from '../legal/legal-content';
import { LoginPage } from './LoginPage';
import type { AuthSession, AuthUserSummary } from './types';
import {
  useAuthSession,
  type AuthService,
  type AuthStatus,
} from './useAuthSession';

export interface LoginIntent {
  title: string;
  description: string;
  action(): void | Promise<void>;
}

interface AuthContextValue {
  status: AuthStatus;
  session?: AuthSession;
  error?: string;
  intent?: LoginIntent;
  requestLogin(intent: LoginIntent): void;
  dismissLogin(): void;
  login(): Promise<void>;
  logout(): void;
  updateUser(user: AuthUserSummary): void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps extends PropsWithChildren {
  service?: AuthService;
}

export function AuthProvider({ children, service }: AuthProviderProps) {
  const auth = useAuthSession(service);
  const [intent, setIntent] = useState<LoginIntent>();
  const resumedSessionRef = useRef<AuthSession>();

  useEffect(() => {
    if (
      auth.status !== 'authenticated' ||
      !auth.session ||
      !intent ||
      resumedSessionRef.current === auth.session
    )
      return;
    const pending = intent;
    resumedSessionRef.current = auth.session;
    setIntent(undefined);
    void pending.action();
  }, [auth.session, auth.status, intent]);

  const requestLogin = useCallback(
    (nextIntent: LoginIntent) => {
      if (auth.status === 'authenticated') {
        void nextIntent.action();
        return;
      }
      setIntent(nextIntent);
    },
    [auth.status],
  );

  const dismissLogin = useCallback(() => setIntent(undefined), []);
  const login = () =>
    auth.login({
      userAgreementVersion: LEGAL_VERSION_ID,
      privacyPolicyVersion: LEGAL_VERSION_ID,
      acceptedAt: new Date().toISOString(),
    });

  return (
    <AuthContext.Provider
      value={{
        status: auth.status,
        session: auth.session,
        error: auth.error,
        intent,
        requestLogin,
        dismissLogin,
        login,
        logout: auth.logout,
        updateUser: auth.updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthLoginModal() {
  const auth = useAuth();
  if (!auth.intent || auth.status === 'authenticated') return null;

  return (
    <LoginPage
      presentation="modal"
      title={auth.intent.title}
      description={auth.intent.description}
      status={
        auth.status === 'authenticating' ? 'authenticating' : 'unauthenticated'
      }
      error={auth.error}
      onCancel={auth.dismissLogin}
      onLogin={auth.login}
      onOpenLegal={(document) => {
        void Taro.navigateTo({
          url: '/pages/legal/index?document=' + document,
        });
      }}
    />
  );
}

export function useOptionalAuth() {
  return useContext(AuthContext);
}

export function useAuth() {
  const value = useOptionalAuth();
  if (!value) throw new Error('useAuth 必须在 AuthProvider 内使用');
  return value;
}
