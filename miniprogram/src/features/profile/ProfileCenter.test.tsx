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
        avatarFileId="cloud://avatar.jpg"
        recentFeelLabel="舒适"
        onLogout={onLogout}
        preferenceSlot={<span>体感选择器</span>}
      />,
    );
    expect(screen.getByText('最近体感: 舒适')).toBeInTheDocument();
    expect(screen.getByText('体感选择器')).toBeInTheDocument();
    expect(screen.getByTestId('profile-avatar')).toHaveAttribute(
      'src',
      'cloud://avatar.jpg',
    );
    const button = screen.getByRole('button', { name: '退出当前账户' });
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

  it('按原型分组展示帮助、定位、协议和账号数据入口', async () => {
    render(
      <ProfileCenter
        nickname="微信用户"
        recentFeelLabel="微凉"
        onLogout={vi.fn()}
      />,
    );

    expect(screen.getByText('帮助与支持')).toBeInTheDocument();
    const question = screen.getByRole('button', {
      name: '为什么建议中不包含衣橱里的具体款式？',
    });
    expect(
      screen.queryByText(/核心定位是“温差应对工具”/),
    ).not.toBeInTheDocument();
    fireEvent.click(question);
    expect(screen.getByText(/核心定位是“温差应对工具”/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '地理定位授权' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '用户协议与隐私政策' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '账号与数据说明' }),
    ).toBeInTheDocument();
  });

  it('头像和昵称都提供查看或更换入口', () => {
    render(
      <ProfileCenter
        nickname="微信用户"
        avatarFileId="cloud://avatar.jpg"
        recentFeelLabel="舒适"
        onLogout={vi.fn()}
        onProfileChange={vi.fn()}
        profileVersion={1}
      />,
    );

    expect(
      screen.getByRole('button', { name: '查看或修改头像' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '查看或修改昵称' }),
    ).toBeInTheDocument();
  });

  it('定位开关使用真机定位链路申请权限并立即更新状态', async () => {
    vi.mocked(Taro.getSetting).mockResolvedValueOnce({
      authSetting: {},
    } as never);
    vi.mocked(Taro.getLocation).mockResolvedValueOnce({
      latitude: 31.2,
      longitude: 121.5,
    } as never);
    render(
      <ProfileCenter
        nickname="微信用户"
        recentFeelLabel="舒适"
        onLogout={vi.fn()}
      />,
    );

    const permission = await screen.findByRole('button', {
      name: '地理定位授权',
    });
    expect(permission).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(permission);
    await waitFor(() =>
      expect(Taro.getLocation).toHaveBeenCalledWith({ type: 'gcj02' }),
    );
    expect(permission).toHaveAttribute('aria-pressed', 'true');
  });

  it('定位权限曾被拒绝时使用微信原生设置按钮', async () => {
    vi.mocked(Taro.getSetting).mockResolvedValueOnce({
      authSetting: { 'scope.userLocation': false },
    } as never);
    render(
      <ProfileCenter
        nickname="微信用户"
        recentFeelLabel="舒适"
        onLogout={vi.fn()}
      />,
    );

    const permission = await screen.findByRole('button', {
      name: '地理定位授权',
    });
    await waitFor(() =>
      expect(permission).toHaveAttribute('data-open-type', 'openSetting'),
    );
    fireEvent.click(permission);
    expect(Taro.openSetting).not.toHaveBeenCalled();
  });

  it('设置入口使用原型对应的定位、协议和数据图标', () => {
    const { container } = render(
      <ProfileCenter
        nickname="微信用户"
        recentFeelLabel="舒适"
        onLogout={vi.fn()}
      />,
    );
    expect(
      container.querySelector('img[src="/assets/icons/profile-location.svg"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('img[src="/assets/icons/profile-policy.svg"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('img[src="/assets/icons/profile-data.svg"]'),
    ).toBeInTheDocument();
  });

  it('点击协议入口打开可滚动的完整协议页面', () => {
    render(
      <ProfileCenter
        nickname="微信用户"
        recentFeelLabel="舒适"
        onLogout={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '用户协议与隐私政策' }));

    expect(Taro.navigateTo).toHaveBeenCalledWith({
      url: '/pages/legal/index?document=agreement',
    });
  });

  it('点击头像先显示查看和修改，修改后显示三种来源', async () => {
    vi.mocked(Taro.showActionSheet).mockResolvedValueOnce({
      tapIndex: 1,
    } as never);
    render(
      <ProfileCenter
        nickname="微信用户12138"
        avatarFileId="cloud://avatar.jpg"
        recentFeelLabel="舒适"
        onLogout={vi.fn()}
        onProfileChange={vi.fn()}
        profileVersion={1}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '查看或修改头像' }));
    await waitFor(() =>
      expect(Taro.showActionSheet).toHaveBeenCalledWith({
        itemList: ['查看头像', '修改头像'],
      }),
    );
    expect(
      screen.getByRole('button', { name: '使用微信头像' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '从相册选择' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '拍照上传' }),
    ).toBeInTheDocument();
  });

  it.each([
    ['从相册选择', ['album']],
    ['拍照上传', ['camera']],
  ] as const)(
    '修改头像选择%s时只打开对应图片来源',
    async (label, sourceType) => {
      vi.mocked(Taro.showActionSheet).mockResolvedValueOnce({
        tapIndex: 1,
      } as never);
      vi.mocked(Taro.chooseMedia).mockResolvedValueOnce({
        tempFiles: [{ tempFilePath: '/tmp/avatar.jpg' }],
      } as never);
      render(
        <ProfileCenter
          nickname="微信用户12138"
          avatarFileId="cloud://avatar.jpg"
          recentFeelLabel="舒适"
          onLogout={vi.fn()}
          onProfileChange={vi.fn()}
          profileVersion={1}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: '查看或修改头像' }));
      await screen.findByRole('button', { name: label });
      fireEvent.click(screen.getByRole('button', { name: label }));
      await waitFor(() =>
        expect(Taro.chooseMedia).toHaveBeenCalledWith({
          count: 1,
          mediaType: ['image'],
          sourceType,
        }),
      );
    },
  );

  it('点击昵称后使用微信原生昵称输入并允许手动编辑', () => {
    render(
      <ProfileCenter
        nickname="微信用户12138"
        recentFeelLabel="舒适"
        onLogout={vi.fn()}
        onProfileChange={vi.fn()}
        profileVersion={1}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '查看或修改昵称' }));
    expect(
      screen.getByRole('textbox', { name: '昵称（可使用微信昵称）' }),
    ).toHaveAttribute('type', 'nickname');
  });
});
