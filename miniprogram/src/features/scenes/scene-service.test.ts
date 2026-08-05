import { expect, it, vi } from 'vitest';

import { createSceneService } from './scene-service';

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

it('通过统一云函数路由读取场景列表', async () => {
  const call = vi.fn().mockResolvedValue({ data: { items: [preset] } });
  const service = createSceneService(call);
  await expect(service.list()).resolves.toEqual([preset]);
  expect(call).toHaveBeenCalledWith({ method: 'GET', path: '/v1/scenes' });
});

it('网络和异常响应使用可读错误', async () => {
  await expect(
    createSceneService(vi.fn().mockRejectedValue('secret')).list(),
  ).rejects.toThrow('网络连接失败，请稍后重试');
  await expect(
    createSceneService(vi.fn().mockResolvedValue({ data: {} })).list(),
  ).rejects.toThrow('场景响应异常，请稍后重试');
});
