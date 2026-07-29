import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LegalDocument } from './LegalDocument';
import { LEGAL_VERSION, LEGAL_VERSION_ID } from './legal-content';

describe('LegalDocument', () => {
  it('协议展示日期与登录记录版本保持一致', () => {
    expect(LEGAL_VERSION_ID).toBe('2026-07-29');
    expect(LEGAL_VERSION).toBe('2026年7月29日');
  });

  it('从登录页进入用户协议时展示完整协议并可切换到隐私政策', () => {
    render(<LegalDocument initialDocument="agreement" />);

    expect(screen.getByText('穿衣有数用户协议')).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`版本：${LEGAL_VERSION}`)),
    ).toBeInTheDocument();
    expect(screen.getByText(/用户内容与使用授权/)).toBeInTheDocument();
    expect(screen.getByText(/退出登录只清除本机登录状态/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '隐私政策' }));

    expect(screen.getByText('穿衣有数隐私政策')).toBeInTheDocument();
    expect(screen.getByText(/第三方服务与委托处理/)).toBeInTheDocument();
    expect(screen.getByText(/deepseek-v4-flash/)).toBeInTheDocument();
  });

  it('隐私政策中提供真实联系方式且不包含待填写占位符', () => {
    const { container } = render(<LegalDocument initialDocument="privacy" />);

    expect(screen.getByText(/wangzitong0208@126\.com/)).toBeInTheDocument();
    expect(screen.getByText(/18981460778/)).toBeInTheDocument();
    expect(container.textContent).not.toContain('待填写');
  });
});
