import { type PropsWithChildren } from 'react';

import { AuthLoginModal } from './AuthGate';

export function AuthenticatedPage({ children }: PropsWithChildren) {
  return (
    <>
      {children}
      <AuthLoginModal />
    </>
  );
}
