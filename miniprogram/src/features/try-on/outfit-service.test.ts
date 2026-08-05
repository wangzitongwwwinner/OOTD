import { describe, expect, it, vi } from 'vitest';

import { createOutfitService, type SavedOutfit } from './outfit-service';

const savedOutfit: SavedOutfit = {
  id: 'outfit_1',
  name: '周一通勤',
  seasonTags: ['春秋'],
  colorTags: ['米白'],
  canvasVersion: 1,
  nodes: [
    {
      clothingId: 'clothing_1',
      x: 0.4,
      y: 0.2,
      scale: 1,
      rotation: 0,
      zIndex: 1,
    },
  ],
  createdAt: '2026-07-26T08:00:00.000Z',
  updatedAt: '2026-07-26T08:00:00.000Z',
  version: 1,
};

describe('outfit service', () => {
  it('按当前版本删除搭配', async () => {
    const call = vi
      .fn()
      .mockResolvedValue({ data: {}, requestId: 'req_delete' });
    const service = createOutfitService(call);
    await expect(service.delete('outfit_1', 3)).resolves.toBeUndefined();
    expect(call).toHaveBeenCalledWith({
      method: 'DELETE',
      path: '/v1/outfits/outfit_1',
      body: { expectedVersion: 3 },
    });
  });

  it('保存搭配时只发送公开画布数据', async () => {
    const call = vi.fn().mockResolvedValue({
      data: savedOutfit,
      requestId: 'req_create',
    });
    const service = createOutfitService(call);

    await expect(
      service.create({
        name: '周一通勤',
        seasonTags: ['春秋'],
        colorTags: ['米白'],
        canvasVersion: 1,
        nodes: savedOutfit.nodes,
      }),
    ).resolves.toEqual(savedOutfit);
    expect(call).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/outfits',
      body: {
        name: '周一通勤',
        seasonTags: ['春秋'],
        colorTags: ['米白'],
        canvasVersion: 1,
        nodes: savedOutfit.nodes,
      },
    });
  });

  it('加载列表和详情并严格校验响应', async () => {
    const call = vi
      .fn()
      .mockResolvedValueOnce({
        data: { items: [savedOutfit] },
        requestId: 'req_list',
      })
      .mockResolvedValueOnce({
        data: savedOutfit,
        requestId: 'req_detail',
      });
    const service = createOutfitService(call);

    await expect(service.list()).resolves.toEqual([savedOutfit]);
    await expect(service.get('outfit_1')).resolves.toEqual(savedOutfit);
    expect(call).toHaveBeenLastCalledWith({
      method: 'GET',
      path: '/v1/outfits/outfit_1',
    });
  });

  it('透传服务端友好错误并拒绝异常响应', async () => {
    const failure = createOutfitService(
      vi.fn().mockResolvedValue({
        error: { message: '搭配不存在或已删除' },
        requestId: 'req_missing',
      }),
    );
    await expect(failure.get('missing')).rejects.toThrow('搭配不存在或已删除');

    const invalid = createOutfitService(
      vi.fn().mockResolvedValue({
        data: { ...savedOutfit, nodes: [{ ...savedOutfit.nodes[0], x: 2 }] },
        requestId: 'req_invalid',
      }),
    );
    await expect(invalid.get('outfit_1')).rejects.toThrow(
      '搭配响应异常，请稍后重试',
    );
  });

  it('云函数连接失败时返回可操作提示', async () => {
    const service = createOutfitService(
      vi.fn().mockRejectedValue(new Error('internal')),
    );

    await expect(service.list()).rejects.toThrow('网络连接失败，请稍后重试');
  });
});
