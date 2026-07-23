import { Button, Image, Input, Text, View } from '@tarojs/components';
import { useMemo, useState } from 'react';

import type { ClothingCategory, PublicClothing } from './clothing-service';
import { filterClothing } from './wardrobe-filters';

const categories: Array<{ value: ClothingCategory | ''; label: string }> = [
  { value: '', label: '全部' },
  { value: 'top', label: '上装' },
  { value: 'bottom', label: '下装' },
  { value: 'shoes', label: '鞋履' },
  { value: 'accessory', label: '配饰' },
];

export function WardrobeBrowser({ items }: { items: PublicClothing[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ClothingCategory | ''>('');
  const [color, setColor] = useState('');
  const colors = useMemo(
    () => Array.from(new Set(items.map((item) => item.color))),
    [items],
  );
  const visible = filterClothing(items, { query, category, color });

  return (
    <View className="wardrobe-browser">
      <Text className="wardrobe-browser__title">已入库衣物</Text>
      <Input
        aria-label="搜索衣物名称"
        placeholder="搜索衣物名称"
        value={query}
        onInput={(event) => setQuery(event.detail.value)}
      />
      <View className="wardrobe-browser__filters">
        {categories.map((option) => (
          <Button
            key={option.value || 'all'}
            className={category === option.value ? 'is-active' : ''}
            onClick={() => setCategory(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </View>
      <View className="wardrobe-browser__filters">
        <Button
          className={!color ? 'is-active' : ''}
          onClick={() => setColor('')}
        >
          全部颜色
        </Button>
        {colors.map((itemColor) => (
          <Button
            key={itemColor}
            className={color === itemColor ? 'is-active' : ''}
            onClick={() => setColor(itemColor)}
          >
            {itemColor}
          </Button>
        ))}
      </View>
      {visible.length === 0 ? (
        <Text className="wardrobe-browser__empty">暂无符合条件的衣物</Text>
      ) : (
        <View className="wardrobe-browser__grid">
          {visible.map((item) => (
            <View key={item.id} className="wardrobe-browser__card">
              <Image
                src={item.processedFileId ?? item.sourceFileId}
                mode="aspectFit"
              />
              <Text>{item.name}</Text>
              <Text>{item.color}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
