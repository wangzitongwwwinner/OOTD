import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  shouldRequestWechatProfile,
  WechatProfileSetup,
} from './WechatProfileSetup';

const profile = {
  id: 'user_1',
  nickname: '微信用户',
  recentFeelPreference: 'comfortable' as const,
  createdAt: '2026-07-28T02:00:00.000Z',
  updatedAt: '2026-07-28T02:00:00.000Z',
  version: 1,
};

describe('首次微信资料确认', () => {
  it('仅默认昵称或缺少头像时请求确认', () => {
    expect(shouldRequestWechatProfile(profile)).toBe(true);
    expect(
      shouldRequestWechatProfile({
        ...profile,
        nickname: '梓桐',
        avatarFileId: 'cloud://avatar.jpg',
      }),
    ).toBe(false);
  });

  it('使用微信原生头像和昵称入口并保存确认后的资料', async () => {
    const updateDetails = vi.fn().mockResolvedValue({
      ...profile,
      nickname: '梓桐',
      avatarFileId: 'cloud://avatar.jpg',
      version: 2,
    });
    const uploadAvatar = vi.fn().mockResolvedValue('cloud://avatar.jpg');
    const onComplete = vi.fn();
    const { container } = render(
      <WechatProfileSetup
        profile={profile}
        service={{ updateDetails }}
        uploadAvatar={uploadAvatar}
        onComplete={onComplete}
        onSkip={vi.fn()}
      />,
    );

    const avatar = screen.getByRole('button', { name: '选择微信头像' });
    expect(avatar).toHaveAttribute('data-open-type', 'chooseAvatar');
    expect(container.querySelector('input')).toHaveAttribute(
      'type',
      'nickname',
    );
    fireEvent.input(screen.getByLabelText('微信昵称'), {
      target: { value: '梓桐' },
    });
    fireEvent.click(screen.getByRole('button', { name: '确认使用' }));
    await waitFor(() =>
      expect(updateDetails).toHaveBeenCalledWith({ nickname: '梓桐' }, 1),
    );
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ nickname: '梓桐', version: 2 }),
    );
  });
});
