import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Button, Text } from '@tarojs/components';
import { expect, it, vi } from 'vitest';

import { AuthLoginModal, AuthProvider, useAuth } from './AuthGate';

function Trigger({ action }: { action: () => void }) {
  const auth = useAuth();
  return (
    <>
      <Text data-testid="status">{auth.status}</Text>
      <Button
        onClick={() =>
          auth.requestLogin({
            title: '登录后进入用户中心',
            description: '当前页面会为您保留',
            action,
          })
        }
      >
        打开用户中心
      </Button>
    </>
  );
}

it('游客请求受保护操作时打开登录弹层，取消后不执行操作', async () => {
  const action = vi.fn();
  render(
    <AuthProvider
      service={{
        restoreAuthSession: vi.fn(() => undefined),
        loginWithWechatAgreement: vi.fn(),
        clearAuthSession: vi.fn(),
      }}
    >
      <Trigger action={action} />
      <AuthLoginModal />
    </AuthProvider>,
  );

  await waitFor(() =>
    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'),
  );
  fireEvent.click(screen.getByRole('button', { name: '打开用户中心' }));
  expect(screen.getByText('登录后进入用户中心')).toBeInTheDocument();
  expect(screen.getByText('当前页面会为您保留')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '暂不登录' }));
  expect(action).not.toHaveBeenCalled();
  expect(screen.queryByText('登录后进入用户中心')).toBeNull();
});

it('登录成功后只续接一次原操作', async () => {
  const action = vi.fn();
  const session = {
    schemaVersion: 1 as const,
    userIsolationKey: 'user_1',
    authenticatedAt: '2026-07-31T01:00:00.000Z',
    expiresAt: '2026-08-31T01:00:00.000Z',
    user: {
      id: 'user_1',
      nickname: '微信用户',
      recentFeelPreference: 'comfortable' as const,
      createdAt: '2026-07-31T01:00:00.000Z',
      updatedAt: '2026-07-31T01:00:00.000Z',
      version: 1,
    },
  };
  render(
    <AuthProvider
      service={{
        restoreAuthSession: vi.fn(() => undefined),
        loginWithWechatAgreement: vi.fn().mockResolvedValue(session),
        clearAuthSession: vi.fn(),
      }}
    >
      <Trigger action={action} />
      <AuthLoginModal />
    </AuthProvider>,
  );

  await waitFor(() =>
    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'),
  );
  fireEvent.click(screen.getByRole('button', { name: '打开用户中心' }));
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: '微信一键登录' }));
  await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
  expect(screen.queryByText('登录后进入用户中心')).toBeNull();
});
