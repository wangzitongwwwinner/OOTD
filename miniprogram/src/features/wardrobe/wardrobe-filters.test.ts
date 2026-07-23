import { describe, expect, it } from 'vitest';

import { filterClothing } from './wardrobe-filters';

const items = [
  {
    id: '1',
    name: '白色衬衫',
    category: 'top' as const,
    color: '白色',
    sourceFileId: 'cloud://source-1',
    processedFileId: 'cloud://processed-1',
    processingStatus: 'ready' as const,
    createdAt: '2026-07-22T00:00:00.000Z',
    updatedAt: '2026-07-22T00:00:00.000Z',
    version: 1,
  },
  {
    id: '2',
    name: '黑色长裤',
    category: 'bottom' as const,
    color: '黑色',
    sourceFileId: 'cloud://source-2',
    processedFileId: 'cloud://processed-2',
    processingStatus: 'ready' as const,
    createdAt: '2026-07-22T00:00:00.000Z',
    updatedAt: '2026-07-22T00:00:00.000Z',
    version: 1,
  },
];

describe('filterClothing', () => {
  it('组合名称、分类和颜色筛选正式衣物', () => {
    expect(
      filterClothing(items, {
        query: ' 衬衫 ',
        category: 'top',
        color: '白色',
      }),
    ).toEqual([items[0]]);
    expect(
      filterClothing(items, { query: '', category: 'bottom', color: '' }),
    ).toEqual([items[1]]);
  });
});
