import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Taro from '@tarojs/taro';
import { describe, expect, it, vi } from 'vitest';

import { ProfileCenter } from './ProfileCenter';

describe('ProfileCenter', () => {
  it('取消时保留会话，确认后退出并回到首页', async () => {
    const onLogout = vi.fn();
    vi.mocked(Taro.showModal)
      .mockResolvedValueOnce({ confirm: false, cancel: true } as never)
      .mockResolvedValueOnce({ confirm: true, cancel: false } as never);
    render(
      <ProfileCenter
        nickname="微信用户"
        recentFeelLabel="舒适"
        onLogout={onLogout}
      />,
    );
    const button = screen.getByRole('button', { name: '退出登录' });
    fireEvent.click(button);
    await waitFor(() => expect(Taro.showModal).toHaveBeenCalledTimes(1));
    expect(onLogout).not.toHaveBeenCalled();

    fireEvent.click(button);
    await waitFor(() => expect(onLogout).toHaveBeenCalledTimes(1));
    expect(Taro.reLaunch).toHaveBeenCalledWith({ url: '/pages/index/index' });
  });

  it('账号与数据说明明确区分退出登录和账号注销', async () => {
    vi.mocked(Taro.showModal).mockReset();
    vi.mocked(Taro.showModal).mockResolvedValue({
      confirm: true,
      cancel: false,
    } as never);
    render(
      <ProfileCenter
        nickname="微信用户"
        recentFeelLabel="舒适"
        onLogout={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '账号与数据说明' }));
    await waitFor(() =>
      expect(Taro.showModal).toHaveBeenCalledWith({
        title: '账号与数据说明',
        content:
          '退出登录不会删除云端数据。当前版本暂不支持账号注销；相关能力后续将按微信平台规则提供。',
        showCancel: false,
      }),
    );
  });
});
