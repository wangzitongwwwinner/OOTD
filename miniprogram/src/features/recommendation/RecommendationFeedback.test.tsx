import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { AuthLoginModal, AuthProvider } from '../auth/AuthGate';
import { RecommendationFeedback } from './RecommendationFeedback';
import type { RecommendationRating } from './feedback-service';

const session = {
  schemaVersion: 1 as const,
  userIsolationKey: 'user_1',
  authenticatedAt: '2026-08-01T01:00:00.000Z',
  expiresAt: '2026-09-01T01:00:00.000Z',
  user: {
    id: 'user_1',
    nickname: '微信用户12138',
    recentFeelPreference: 'comfortable' as const,
    createdAt: '2026-08-01T01:00:00.000Z',
    updatedAt: '2026-08-01T01:00:00.000Z',
    version: 1,
  },
};

function renderGuestFeedback(
  save: (
    recommendationId: string,
    rating: RecommendationRating,
  ) => Promise<RecommendationRating>,
) {
  const loginWithWechatAgreement = vi.fn().mockResolvedValue(session);
  render(
    <AuthProvider
      service={{
        restoreAuthSession: vi.fn(() => undefined),
        loginWithWechatAgreement,
        clearAuthSession: vi.fn(),
      }}
    >
      <RecommendationFeedback recommendationId="rec-guest" service={{ save }} />
      <AuthLoginModal />
    </AuthProvider>,
  );
  return { loginWithWechatAgreement };
}

it('游客选择评价后要求登录，取消不产生评价', async () => {
  const save = vi.fn(
    async (_recommendationId: string, rating: RecommendationRating) => rating,
  );
  renderGuestFeedback(save);

  await waitFor(() =>
    expect(screen.getByRole('button', { name: /有帮助/ })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole('button', { name: /有帮助/ }));

  expect(screen.getByText('登录后提交建议评价')).toBeInTheDocument();
  expect(save).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '暂不登录' }));
  expect(save).not.toHaveBeenCalled();
});

it('游客登录成功后自动提交原选评价且只提交一次', async () => {
  const save = vi.fn(
    async (_recommendationId: string, rating: RecommendationRating) => rating,
  );
  renderGuestFeedback(save);

  await waitFor(() =>
    expect(screen.getByRole('button', { name: /没帮助/ })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole('button', { name: /没帮助/ }));
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: '微信一键登录' }));

  await waitFor(() =>
    expect(save).toHaveBeenCalledWith('rec-guest', 'unhelpful'),
  );
  expect(save).toHaveBeenCalledTimes(1);
  expect(await screen.findByText('已保存 · 可随时修改')).toBeInTheDocument();
});
it('界面第二人称统一使用敬称', () => {
  const { container } = render(
    <RecommendationFeedback
      recommendationId="rec-honorific"
      service={{ save: vi.fn() }}
    />,
  );

  expect(container.textContent).toContain('您');
  expect(container.textContent).not.toContain('你');
});

it('提交评价并允许修改', async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(
    <RecommendationFeedback recommendationId="rec-1" service={{ save }} />,
  );
  fireEvent.click(screen.getByRole('button', { name: /有帮助/ }));
  await waitFor(() => expect(save).toHaveBeenCalledWith('rec-1', 'helpful'));
  expect(await screen.findByText('已保存 · 可随时修改')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /一般/ }));
  await waitFor(() =>
    expect(save).toHaveBeenLastCalledWith('rec-1', 'neutral'),
  );
});

it('失败后保留重试入口', async () => {
  const save = vi
    .fn()
    .mockRejectedValueOnce(new Error('评价保存失败'))
    .mockResolvedValueOnce(undefined);
  render(
    <RecommendationFeedback recommendationId="rec-1" service={{ save }} />,
  );
  fireEvent.click(screen.getByRole('button', { name: /没帮助/ }));
  const retry = await screen.findByRole('button', {
    name: '评价保存失败，点击重试',
  });
  fireEvent.click(retry);
  await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
});
