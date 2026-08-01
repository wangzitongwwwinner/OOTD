import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { AuthLoginModal, AuthProvider } from '../auth/AuthGate';
import { SceneList } from './SceneList';

const preset = {
  id: 'preset_office',
  name: '办公室',
  category: 'office' as const,
  estimatedTemperatureCelsius: 22,
  feel: 'cold' as const,
  isPreset: true,
  createdAt: '2026-07-16T00:00:00.000Z',
  updatedAt: '2026-07-16T00:00:00.000Z',
  version: 1,
};

it('展示所有场景并提供编辑按钮', async () => {
  render(
    <SceneList
      service={{
        list: vi.fn().mockResolvedValue([preset]),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      }}
    />,
  );
  expect(screen.getByText('正在加载场景…')).toBeInTheDocument();
  expect(await screen.findByText('办公室')).toBeInTheDocument();
  expect(screen.getByText(/22°C/)).toBeInTheDocument();
  expect(screen.getByText('体感: 偏冷')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: '编辑 办公室' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: '添加新场景' }),
  ).toBeInTheDocument();
});

it('加载失败时可以重试', async () => {
  const list = vi
    .fn()
    .mockRejectedValueOnce(new Error('场景加载失败，请稍后重试'))
    .mockResolvedValueOnce([preset]);
  render(
    <SceneList
      service={{ list, create: vi.fn(), update: vi.fn(), delete: vi.fn() }}
    />,
  );
  expect(
    await screen.findByText('场景加载失败，请稍后重试'),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '重新加载' }));
  expect(await screen.findByText('办公室')).toBeInTheDocument();
  expect(list).toHaveBeenCalledTimes(2);
});

const session = {
  schemaVersion: 1 as const,
  userIsolationKey: 'user_1',
  authenticatedAt: '2026-08-01T06:00:00.000Z',
  expiresAt: '2026-09-01T06:00:00.000Z',
  user: {
    id: 'user_1',
    nickname: '微信用户12138',
    recentFeelPreference: 'comfortable' as const,
    createdAt: '2026-08-01T06:00:00.000Z',
    updatedAt: '2026-08-01T06:00:00.000Z',
    version: 1,
  },
};

function renderGuest(service: {
  list: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}) {
  render(
    <AuthProvider
      service={{
        restoreAuthSession: vi.fn(() => undefined),
        loginWithWechatAgreement: vi.fn().mockResolvedValue(session),
        clearAuthSession: vi.fn(),
      }}
    >
      <SceneList
        service={
          service as unknown as NonNullable<
            React.ComponentProps<typeof SceneList>['service']
          >
        }
      />
      <AuthLoginModal />
    </AuthProvider>,
  );
}

it('游客展示四个稳定示例场景且不请求个人列表', async () => {
  const service = {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  renderGuest(service);

  for (const name of ['办公室', '家', '地铁通勤', '商场']) {
    expect(await screen.findByText(name)).toBeInTheDocument();
  }
  expect(service.list).not.toHaveBeenCalled();
});

it('游客可填写新场景，取消登录不写入且保留表单', async () => {
  const service = {
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  renderGuest(service);

  fireEvent.click(await screen.findByRole('button', { name: '添加新场景' }));
  fireEvent.input(screen.getByPlaceholderText('例如：书店、健身房、大平层'), {
    target: { value: '书店' },
  });
  fireEvent.click(screen.getByRole('button', { name: '确认新建' }));

  expect(screen.getByText('登录后保存新场景')).toBeInTheDocument();
  expect(service.create).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '暂不登录' }));
  expect(screen.getByDisplayValue('书店')).toBeInTheDocument();
  expect(service.create).not.toHaveBeenCalled();
});

it('游客编辑示例场景后登录，自动续接原修改一次', async () => {
  const updated = { ...preset, name: '冬季办公室', version: 2 };
  const service = {
    list: vi.fn().mockResolvedValue([updated]),
    create: vi.fn(),
    update: vi.fn().mockResolvedValue(updated),
    delete: vi.fn(),
  };
  renderGuest(service);

  fireEvent.click(await screen.findByRole('button', { name: '编辑 办公室' }));
  fireEvent.input(screen.getByDisplayValue('办公室'), {
    target: { value: '冬季办公室' },
  });
  fireEvent.click(screen.getByRole('button', { name: '保存修改' }));
  expect(screen.getByText('登录后保存场景修改')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: '微信一键登录' }));

  await waitFor(() => expect(service.update).toHaveBeenCalledTimes(1));
  expect(service.update).toHaveBeenCalledWith(
    'preset_office',
    expect.objectContaining({ name: '冬季办公室', expectedVersion: 1 }),
  );
});

it('游客点击删除时登录，取消不删除', async () => {
  const service = {
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  renderGuest(service);

  fireEvent.click(await screen.findByRole('button', { name: '删除 商场' }));
  expect(screen.getByText('登录后删除场景')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '暂不登录' }));
  expect(service.delete).not.toHaveBeenCalled();
  expect(screen.getByText('商场')).toBeInTheDocument();
});
