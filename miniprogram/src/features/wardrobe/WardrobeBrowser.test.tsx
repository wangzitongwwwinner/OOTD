import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { WardrobeBrowser } from './WardrobeBrowser';
import type { PublicClothing } from './clothing-service';

const items: PublicClothing[] = [
  {
    id: 'clothing_1',
    name: '白色 T 恤',
    category: 'top',
    color: '白色',
    sourceFileId: 'cloud://source-1.jpg',
    processedFileId: 'cloud://processed-1.png',
    processingStatus: 'ready',
    createdAt: '2026-07-23T08:00:00.000Z',
    updatedAt: '2026-07-23T08:00:00.000Z',
    version: 4,
  },
  {
    id: 'clothing_2',
    name: '黑色皮鞋',
    category: 'shoes',
    color: '黑色',
    sourceFileId: 'cloud://source-2.jpg',
    processedFileId: 'cloud://processed-2.png',
    processingStatus: 'ready',
    createdAt: '2026-07-23T08:00:00.000Z',
    updatedAt: '2026-07-23T08:00:00.000Z',
    version: 4,
  },
];

describe('WardrobeBrowser', () => {
  it('支持按名称搜索以及类别和颜色组合筛选', () => {
    render(<WardrobeBrowser items={items} />);
    expect(screen.getByLabelText('搜索衣物名称')).toHaveClass(
      'wardrobe-browser__search',
    );
    expect(screen.getAllByText('上装')).toHaveLength(2);
    fireEvent.input(screen.getByLabelText('搜索衣物名称'), {
      target: { value: '黑色' },
    });
    expect(screen.queryByText('白色 T 恤')).not.toBeInTheDocument();
    expect(screen.getByText('黑色皮鞋')).toBeInTheDocument();

    fireEvent.input(screen.getByLabelText('搜索衣物名称'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: '上装' }));
    fireEvent.click(screen.getByRole('button', { name: '黑色' }));
    expect(screen.getByText('暂无符合条件的衣物')).toBeInTheDocument();
  });

  it('衣物卡片使用统一的标签和操作按钮样式', () => {
    render(
      <WardrobeBrowser
        items={[items[0]]}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const tags = screen.getAllByTestId('clothing-tag');
    expect(tags).toHaveLength(2);
    expect(tags[0]).toHaveClass('wardrobe-browser__tag');
    expect(tags[1]).toHaveClass('wardrobe-browser__tag');
    expect(screen.getByRole('button', { name: '编辑' })).toHaveClass(
      'wardrobe-browser__card-action',
    );
    expect(screen.getByRole('button', { name: '删除' })).toHaveClass(
      'wardrobe-browser__card-action',
    );

    fireEvent.click(screen.getByRole('button', { name: '编辑' }));
    expect(screen.getByLabelText('衣物名称')).toHaveClass(
      'wardrobe-browser__edit-input',
    );
    expect(screen.getByLabelText('衣物颜色')).toHaveClass(
      'wardrobe-browser__edit-input',
    );
  });
});
