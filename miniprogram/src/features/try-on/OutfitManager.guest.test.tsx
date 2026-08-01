import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { AuthLoginModal, AuthProvider } from '../auth/AuthGate';
import { OutfitManager } from './OutfitManager';

function authService() {
  return {
    restoreAuthSession: vi.fn(() => undefined),
    loginWithWechatAgreement: vi.fn(),
    clearAuthSession: vi.fn(),
  };
}

it('游客我的搭配显示默认搭配且不读取个人接口', async () => {
  const list = vi.fn();
  render(
    <AuthProvider service={authService()}>
      <OutfitManager
        mode="list"
        nodes={[]}
        onLoad={vi.fn()}
        service={{ create: vi.fn(), list, delete: vi.fn() }}
      />
      <AuthLoginModal />
    </AuthProvider>,
  );
  expect(await screen.findByText('日常休闲搭配')).toBeInTheDocument();
  expect(list).not.toHaveBeenCalled();
});

it('游客确认保存时要求登录且不保存示例衣物引用', async () => {
  const create = vi.fn();
  render(
    <AuthProvider service={authService()}>
      <OutfitManager
        mode="save"
        nodes={[
          {
            id: 'n1',
            clothingId: 'preset_clothing_jacket',
            x: 0,
            y: 0,
            scale: 1,
            zIndex: 1,
          },
        ]}
        onLoad={vi.fn()}
        onGuestAuthenticated={vi.fn().mockResolvedValue(false)}
        service={{ create, list: vi.fn() }}
      />
      <AuthLoginModal />
    </AuthProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: '保存为我的推荐搭配' }));
  fireEvent.input(screen.getByPlaceholderText(/如：/), {
    target: { value: '游客搭配' },
  });
  fireEvent.click(screen.getByRole('button', { name: '确认保存搭配' }));
  expect(screen.getByText('登录后保存个人搭配')).toBeInTheDocument();
  expect(create).not.toHaveBeenCalled();
});
