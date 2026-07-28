import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { PublicClothing } from '../wardrobe/clothing-service';
import type { SavedOutfit } from './outfit-service';
import {
  filterSavedOutfits,
  getPreviewNodeLayout,
  SavedOutfitLookbook,
} from './SavedOutfitLookbook';

const clothing: PublicClothing = {
  id: 'clothing_1',
  name: '白色衬衫',
  category: 'top',
  color: '白色',
  sourceFileId: 'cloud://source.jpg',
  processedFileId: 'cloud://processed.png',
  processingStatus: 'ready',
  createdAt: '2026-07-20T08:00:00.000Z',
  updatedAt: '2026-07-20T08:00:00.000Z',
  version: 1,
};

const outfit: SavedOutfit = {
  id: 'outfit_1',
  name: '周一通勤',
  seasonTags: ['秋天'],
  colorTags: ['蓝色'],
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

describe('SavedOutfitLookbook', () => {
  it('按画板可移动范围等比映射预览位置和节点尺寸', () => {
    const layout = getPreviewNodeLayout(
      { x: 0.5, y: 0.5, scale: 1.2 },
      { w: 200, h: 360 },
      { w: 96, h: 128 },
    );

    expect(layout.left).toBeCloseTo(26.67, 1);
    expect(layout.top).toBeCloseTo(42.67, 1);
    expect(layout.size).toBeCloseTo(42.67, 1);
    expect(layout.scale).toBe(1.2);
  });

  it('按原型展示筛选器、搭配预览、日期、标签和操作', () => {
    const onLoad = vi.fn();
    const onDelete = vi.fn();
    render(
      <SavedOutfitLookbook
        outfits={[outfit]}
        clothing={[clothing]}
        onLoad={onLoad}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('季节: 全部')).toBeInTheDocument();
    expect(screen.getByText('色系: 全部')).toBeInTheDocument();
    expect(screen.getByText('创建于 2026.07.26')).toBeInTheDocument();
    expect(screen.getByText('秋天')).toBeInTheDocument();
    expect(screen.getByText('蓝色')).toBeInTheDocument();
    expect(
      screen.getAllByTestId('outfit-garment-outfit_1-clothing_1'),
    ).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: '载入编辑 周一通勤' }));
    fireEvent.click(screen.getByRole('button', { name: '删除 周一通勤' }));
    expect(onLoad).toHaveBeenCalledWith(outfit);
    expect(onDelete).toHaveBeenCalledWith(outfit);
  });

  it('按季节和色系组合筛选搭配', () => {
    const winter = {
      ...outfit,
      id: 'outfit_2',
      name: '冬日通勤',
      seasonTags: ['冬天'],
      colorTags: ['黑色'],
    };

    expect(filterSavedOutfits([outfit, winter], '秋天', '蓝色')).toEqual([
      outfit,
    ]);
    expect(filterSavedOutfits([outfit, winter], '春天', '全部')).toEqual([]);
  });

  it('没有匹配搭配时展示原型空状态', () => {
    render(
      <SavedOutfitLookbook
        outfits={[]}
        clothing={[]}
        onLoad={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(
      screen.getByText('暂无保存的搭配。可以前往“试衣间”拼凑衣服并保存哦。'),
    ).toBeInTheDocument();
  });
});
