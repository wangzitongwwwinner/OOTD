import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HomeHeader } from './HomeHeader';

describe('首页品牌栏', () => {
  it('展示品牌和头像入口，不保留临时英文眉题与问候占位', () => {
    const onOpenProfile = vi.fn();
    render(
      <HomeHeader
        nickname="微信用户"
        avatarFileId="cloud://avatar"
        onOpenProfile={onOpenProfile}
      />,
    );

    expect(screen.getByText('今天穿什么')).toBeInTheDocument();
    expect(screen.queryByText('TODAY')).toBeNull();
    expect(screen.queryByText(/你好/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '打开用户中心' }));
    expect(onOpenProfile).toHaveBeenCalledTimes(1);
  });
});
