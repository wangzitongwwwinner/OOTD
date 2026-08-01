import { render, screen } from '@testing-library/react';
import { Text } from '@tarojs/components';
import { expect, it } from 'vitest';

import { AuthProvider } from './AuthGate';
import { AuthenticatedPage } from './AuthenticatedPage';

it('未登录页面外壳不再重定向到登录页', () => {
  render(
    <AuthProvider
      service={{
        restoreAuthSession: () => undefined,
        loginWithWechatAgreement: async () => {
          throw new Error('本测试不执行登录');
        },
        clearAuthSession: () => undefined,
      }}
    >
      <AuthenticatedPage>
        <Text>游客可访问内容</Text>
      </AuthenticatedPage>
    </AuthProvider>,
  );
  expect(screen.getByText('游客可访问内容')).toBeInTheDocument();
  expect(screen.queryByText('正在返回登录页…')).toBeNull();
});
