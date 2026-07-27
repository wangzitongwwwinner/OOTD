import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

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
