import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { ProfilePreference } from './ProfilePreference';

const profile = {
  id: 'user_1',
  nickname: '微信用户',
  recentFeelPreference: 'comfortable' as const,
  createdAt: '2026-07-18T02:00:00.000Z',
  updatedAt: '2026-07-18T02:00:00.000Z',
  version: 1,
};

it('展示当前偏好并以当前版本保存新偏好', async () => {
  const onProfileChange = vi.fn();
  const service = {
    get: vi.fn().mockResolvedValue(profile),
    updateFeel: vi.fn().mockResolvedValue({
      ...profile,
      recentFeelPreference: 'cool',
      version: 2,
    }),
  };
  render(
    <ProfilePreference service={service} onProfileChange={onProfileChange} />,
  );
  expect(await screen.findByRole('button', { name: '舒适' })).toHaveClass(
    'profile-preference__option--selected',
  );
  fireEvent.click(screen.getByRole('button', { name: '微凉' }));
  await waitFor(() =>
    expect(service.updateFeel).toHaveBeenCalledWith('cool', 1),
  );
  expect(await screen.findByRole('button', { name: '微凉' })).toHaveClass(
    'profile-preference__option--selected',
  );
  expect(onProfileChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ recentFeelPreference: 'cool', version: 2 }),
  );
  expect(await screen.findByText('已保存')).toBeInTheDocument();
});

it('读取失败时显示可重试提示', async () => {
  const service = {
    get: vi.fn().mockRejectedValue(new Error('网络连接失败，请稍后重试')),
    updateFeel: vi.fn(),
  };
  render(<ProfilePreference service={service} />);
  expect(
    await screen.findByText('网络连接失败，请稍后重试'),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '重新加载' })).toBeInTheDocument();
});
