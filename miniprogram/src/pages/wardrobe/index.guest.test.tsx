import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

import { AuthProvider } from '../../features/auth/AuthGate';
import WardrobePage from './index';

const mocks = vi.hoisted(() => ({
  listClothing: vi.fn(),
  ensureMediaSourceAccess: vi.fn(),
}));

vi.mock('../../features/wardrobe/clothing-service', async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import('../../features/wardrobe/clothing-service')
    >();
  return {
    ...original,
    listClothing: mocks.listClothing,
    ensureMediaSourceAccess: mocks.ensureMediaSourceAccess,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

function renderGuest() {
  render(
    <AuthProvider
      service={{
        restoreAuthSession: vi.fn(() => undefined),
        loginWithWechatAgreement: vi.fn(),
        clearAuthSession: vi.fn(),
      }}
    >
      <WardrobePage />
    </AuthProvider>,
  );
}

it('游客显示三件默认衣物且不读取个人衣橱', async () => {
  renderGuest();
  expect(await screen.findByText('阿甘鞋')).toBeInTheDocument();
  expect(screen.getByText('皮衣')).toBeInTheDocument();
  expect(screen.getByText('卫裤')).toBeInTheDocument();
  expect(mocks.listClothing).not.toHaveBeenCalled();
});

it('游客点击拍照入口时先要求登录，不申请相机权限', async () => {
  renderGuest();
  fireEvent.click(await screen.findByRole('button', { name: /录入衣物/ }));
  fireEvent.click(screen.getByRole('button', { name: '拍照上传' }));
  expect(screen.getByText('登录后拍照上传')).toBeInTheDocument();
  expect(mocks.ensureMediaSourceAccess).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '暂不登录' }));
  await waitFor(() => expect(screen.queryByText('登录后拍照上传')).toBeNull());
  expect(screen.getByRole('button', { name: '拍照上传' })).toBeInTheDocument();
});
