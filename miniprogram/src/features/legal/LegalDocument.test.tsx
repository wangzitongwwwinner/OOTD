import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LegalDocument } from './LegalDocument';
import {
  LEGAL_VERSION,
  LEGAL_VERSION_ID,
  PRIVACY_POLICY,
  USER_AGREEMENT,
} from './legal-content';

describe('LegalDocument', () => {
  it('协议展示日期与登录记录版本保持一致', () => {
    expect(LEGAL_VERSION_ID).toBe('2026-08-02');
    expect(LEGAL_VERSION).toBe('2026年8月2日');
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

  it('协议与隐私政策覆盖游客模式及当前资料权限规则', () => {
    const agreementText = USER_AGREEMENT.sections
      .flatMap((section) => section.paragraphs)
      .join('');
    const privacyText = PRIVACY_POLICY.sections
      .flatMap((section) => section.paragraphs)
      .join('');

    expect(agreementText).toMatch(/未登录状态下/);
    expect(privacyText).toMatch(/系统默认头像/);
    expect(privacyText).toMatch(/通用天气信息/);
    expect(privacyText).toMatch(/游客推荐快照/);
    expect(privacyText).toMatch(/修改头像/);
    expect(privacyText).not.toMatch(/跳过首次资料确认/);
  });

  it('隐私政策中提供真实联系方式且不包含待填写占位符', () => {
    const { container } = render(<LegalDocument initialDocument="privacy" />);

    expect(screen.getByText(/wangzitong0208@126\.com/)).toBeInTheDocument();
    expect(screen.getByText(/18981460778/)).toBeInTheDocument();
    expect(container.textContent).not.toContain('待填写');
  });
});
