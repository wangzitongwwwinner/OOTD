import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TryOnGarmentCatalog } from './TryOnGarmentCatalog';
import type { PublicClothing } from '../wardrobe/clothing-service';

const clothing: PublicClothing[] = [
  {
    id: 'top_1',
    name: '白色衬衫',
    category: 'top',
    color: '白色',
    sourceFileId: 'cloud://top.jpg',
    processedFileId: 'cloud://top.png',
    processingStatus: 'ready',
    createdAt: '2026-07-28T00:00:00.000Z',
    updatedAt: '2026-07-28T00:00:00.000Z',
    version: 1,
  },
  {
    id: 'shoes_1',
    name: '黑色皮鞋',
    category: 'shoes',
    color: '黑色',
    sourceFileId: 'cloud://shoes.jpg',
    processedFileId: 'cloud://shoes.png',
    processingStatus: 'ready',
    createdAt: '2026-07-28T00:00:00.000Z',
    updatedAt: '2026-07-28T00:00:00.000Z',
    version: 1,
  },
];

describe('TryOnGarmentCatalog', () => {
  it('按原型展示分类和横向衣物目录，点击衣物直接添加', () => {
    const onAdd = vi.fn();
    render(<TryOnGarmentCatalog items={clothing} onAdd={onAdd} />);

    expect(screen.getByText('可选入库衣物')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '全部' })).toHaveClass(
      'is-active',
    );
    expect(screen.getByText('白色衬衫')).toBeInTheDocument();
    expect(screen.getByText('黑色皮鞋')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '鞋履' }));
    expect(screen.queryByText('白色衬衫')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('黑色皮鞋'));
    expect(onAdd).toHaveBeenCalledWith(clothing[1]);
  });
});
