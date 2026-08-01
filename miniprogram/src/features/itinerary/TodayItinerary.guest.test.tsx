import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { AuthLoginModal, AuthProvider } from '../auth/AuthGate';
import { TodayItinerary } from './TodayItinerary';

function renderGuest() {
  const itineraryDataService = {
    listToday: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const sceneDataService = { list: vi.fn() };
  render(
    <AuthProvider
      service={{
        restoreAuthSession: vi.fn(() => undefined),
        loginWithWechatAgreement: vi.fn(),
        clearAuthSession: vi.fn(),
      }}
    >
      <TodayItinerary
        sceneDataService={sceneDataService}
        itineraryDataService={itineraryDataService}
      />
      <AuthLoginModal />
    </AuthProvider>,
  );
  return { itineraryDataService, sceneDataService };
}

it('游客显示两条示例行程且不读取个人接口', async () => {
  const services = renderGuest();
  expect(await screen.findByText('地铁通勤')).toBeInTheDocument();
  expect(screen.getByText('办公室')).toBeInTheDocument();
  expect(services.itineraryDataService.listToday).not.toHaveBeenCalled();
  expect(services.sceneDataService.list).not.toHaveBeenCalled();
});

it('游客确认新增时要求登录，取消后表单与输入保持且不写入', async () => {
  const { itineraryDataService } = renderGuest();
  fireEvent.click(await screen.findByRole('button', { name: /添加行程/ }));
  const input = screen.getByPlaceholderText('08:30');
  fireEvent.input(input, { target: { value: '07:45' } });
  fireEvent.click(screen.getByRole('button', { name: '添加至今日行程' }));
  expect(screen.getByText('登录后添加今日行程')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '暂不登录' }));
  await waitFor(() =>
    expect(screen.queryByText('登录后添加今日行程')).toBeNull(),
  );
  expect(screen.getByPlaceholderText('08:30')).toHaveValue('07:45');
  expect(itineraryDataService.create).not.toHaveBeenCalled();
});
