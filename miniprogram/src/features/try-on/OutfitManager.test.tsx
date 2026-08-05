import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Taro from '@tarojs/taro';
import { describe, expect, it, vi } from 'vitest';

import type { OutfitNode } from './outfit-model';
import type { SavedOutfit } from './outfit-service';
import { OutfitManager } from './OutfitManager';

const node: OutfitNode = {
  id: 'node_1',
  clothingId: 'clothing_1',
  x: 0.4,
  y: 0.2,
  scale: 1,
  zIndex: 1,
};
const saved: SavedOutfit = {
  id: 'outfit_1',
  name: '周一通勤',
  seasonTags: [],
  colorTags: [],
  canvasVersion: 1,
  nodes: [{ ...node, rotation: 0 }],
  createdAt: '2026-07-26T08:00:00.000Z',
  updatedAt: '2026-07-26T08:00:00.000Z',
  version: 1,
};

describe('OutfitManager', () => {
  it('试衣间模式使用主按钮打开原型保存弹层', async () => {
    const create = vi.fn().mockResolvedValue(saved);
    render(
      <OutfitManager
        mode="save"
        nodes={[node]}
        onLoad={vi.fn()}
        service={{ create, list: vi.fn().mockResolvedValue([]) }}
      />,
    );

    expect(
      screen.queryByPlaceholderText('给搭配起个名字'),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '保存为我的推荐搭配' }));
    expect(screen.getByText('保存搭配创意')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '秋天' })).toHaveClass(
      'is-active',
    );
    expect(screen.getByRole('button', { name: '春天' })).not.toHaveClass(
      'is-active',
    );
    fireEvent.input(
      screen.getByPlaceholderText('如：秋日复古通勤、夏日空调房搭配'),
      { target: { value: '秋日通勤' } },
    );
    fireEvent.click(screen.getByRole('button', { name: '确认保存搭配' }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '秋日通勤',
          seasonTags: ['秋天'],
          colorTags: ['蓝色'],
        }),
      ),
    );
  });

  it('空画布阻止保存并给出提示', async () => {
    const create = vi.fn();
    render(
      <OutfitManager
        nodes={[]}
        onLoad={vi.fn()}
        service={{ create, list: vi.fn().mockResolvedValue([]) }}
      />,
    );

    fireEvent.input(screen.getByPlaceholderText('给搭配起个名字'), {
      target: { value: '空搭配' },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存搭配' }));

    expect(await screen.findByText('请先添加至少一件衣物')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('保存时提交归一化节点并防止重复点击', async () => {
    let resolveCreate: (value: SavedOutfit) => void = () => undefined;
    const create = vi.fn(
      () =>
        new Promise<SavedOutfit>((resolve) => {
          resolveCreate = resolve;
        }),
    );
    render(
      <OutfitManager
        nodes={[node]}
        onLoad={vi.fn()}
        service={{ create, list: vi.fn().mockResolvedValue([]) }}
      />,
    );

    fireEvent.input(screen.getByPlaceholderText('给搭配起个名字'), {
      target: { value: '周一通勤' },
    });
    const button = screen.getByRole('button', { name: '保存搭配' });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      name: '周一通勤',
      seasonTags: [],
      colorTags: [],
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
    });
    resolveCreate(saved);
    expect(await screen.findByText('搭配已保存')).toBeInTheDocument();
  });

  it('保存时规范化季节和颜色标签', async () => {
    const create = vi.fn().mockResolvedValue(saved);
    render(
      <OutfitManager
        nodes={[node]}
        onLoad={vi.fn()}
        service={{ create, list: vi.fn().mockResolvedValue([]) }}
      />,
    );
    fireEvent.input(screen.getByPlaceholderText('给搭配起个名字'), {
      target: { value: '周一通勤' },
    });
    fireEvent.input(screen.getByPlaceholderText('季节标签，用逗号分隔'), {
      target: { value: '春秋, 通勤,春秋' },
    });
    fireEvent.input(screen.getByPlaceholderText('颜色标签，用逗号分隔'), {
      target: { value: '米白，黑色, 米白' },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存搭配' }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          seasonTags: ['春秋', '通勤'],
          colorTags: ['米白', '黑色'],
        }),
      ),
    );
  });

  it('展示已保存搭配并将节点重新载入画板', async () => {
    const onLoad = vi.fn();
    render(
      <OutfitManager
        nodes={[]}
        onLoad={onLoad}
        service={{ create: vi.fn(), list: vi.fn().mockResolvedValue([saved]) }}
      />,
    );

    expect(await screen.findByText('周一通勤')).toBeInTheDocument();
    expect(screen.getByText('创建于 2026.07.26')).toBeInTheDocument();

    fireEvent.click(
      await screen.findByRole('button', { name: '载入编辑 周一通勤' }),
    );

    await waitFor(() =>
      expect(onLoad).toHaveBeenCalledWith([
        expect.objectContaining({
          clothingId: 'clothing_1',
          x: 0.4,
          y: 0.2,
          scale: 1,
          zIndex: 1,
        }),
      ]),
    );
  });

  it('页面重新显示时按刷新信号重新读取搭配', async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce([saved])
      .mockResolvedValueOnce([]);
    const service = { create: vi.fn(), list };
    const rendered = render(
      <OutfitManager
        nodes={[]}
        onLoad={vi.fn()}
        refreshKey={0}
        service={service}
      />,
    );
    expect(await screen.findByText('周一通勤')).toBeInTheDocument();

    rendered.rerender(
      <OutfitManager
        nodes={[]}
        onLoad={vi.fn()}
        refreshKey={1}
        service={service}
      />,
    );

    expect(
      await screen.findByText(
        '暂无保存的搭配。可以前往“试衣间”拼凑衣服并保存哦。',
      ),
    ).toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('删除搭配时取消不写入，确认后才从列表移除', async () => {
    const remove = vi.fn().mockResolvedValue(undefined);
    vi.mocked(Taro.showModal)
      .mockResolvedValueOnce({ confirm: false, cancel: true } as never)
      .mockResolvedValueOnce({ confirm: true, cancel: false } as never);
    render(
      <OutfitManager
        nodes={[]}
        onLoad={vi.fn()}
        service={{
          create: vi.fn(),
          list: vi.fn().mockResolvedValue([saved]),
          delete: remove,
        }}
      />,
    );

    const deleteButton = await screen.findByRole('button', {
      name: '删除 周一通勤',
    });
    fireEvent.click(deleteButton);
    await waitFor(() => expect(Taro.showModal).toHaveBeenCalledTimes(1));
    expect(remove).not.toHaveBeenCalled();
    expect(screen.getByText('周一通勤')).toBeInTheDocument();

    fireEvent.click(deleteButton);
    await waitFor(() => expect(remove).toHaveBeenCalledWith('outfit_1', 1));
    await waitFor(() =>
      expect(screen.queryByText('周一通勤')).not.toBeInTheDocument(),
    );
  });
});
