import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LoginPage } from './LoginPage';

describe('登录页', () => {
  it('未同意协议时阻止登录请求并提示用户', () => {
    const onLogin = vi.fn();
    render(
      <LoginPage
        status="unauthenticated"
        onLogin={onLogin}
        onOpenLegal={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '微信一键登录' }));
    expect(onLogin).not.toHaveBeenCalled();
    expect(
      screen.getByText('请先阅读并同意用户协议和隐私政策'),
    ).toBeInTheDocument();
  });

  it('同意协议后发起登录并提供两份协议入口', () => {
    const onLogin = vi.fn();
    const onOpenLegal = vi.fn();
    render(
      <LoginPage
        status="unauthenticated"
        onLogin={onLogin}
        onOpenLegal={onOpenLegal}
      />,
    );
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: '微信一键登录' }));
    expect(onLogin).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('用户协议'));
    fireEvent.click(screen.getByText('隐私政策'));
    expect(onOpenLegal).toHaveBeenNthCalledWith(1, 'agreement');
    expect(onOpenLegal).toHaveBeenNthCalledWith(2, 'privacy');
  });

  it('登录中禁用按钮，失败后显示可重试错误', () => {
    const { rerender } = render(
      <LoginPage
        status="authenticating"
        onLogin={vi.fn()}
        onOpenLegal={vi.fn()}
      />,
    );
    expect(screen.getByRole('button')).toBeDisabled();
    rerender(
      <LoginPage
        status="unauthenticated"
        error="网络连接失败，请稍后重试"
        onLogin={vi.fn()}
        onOpenLegal={vi.fn()}
      />,
    );
    expect(screen.getByText('网络连接失败，请稍后重试')).toBeInTheDocument();
  });
});
