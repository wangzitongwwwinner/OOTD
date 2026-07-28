import { Button, Image, ScrollView, Text, View } from '@tarojs/components';
import { useState } from 'react';

import type {
  ClothingCategory,
  PublicClothing,
} from '../wardrobe/clothing-service';

const categories: Array<{
  value: ClothingCategory | 'all';
  label: string;
}> = [
  { value: 'all', label: '全部' },
  { value: 'top', label: '上衣' },
  { value: 'bottom', label: '下装' },
  { value: 'shoes', label: '鞋履' },
  { value: 'accessory', label: '配饰' },
];

export function TryOnGarmentCatalog({
  items,
  onAdd,
}: {
  items: PublicClothing[];
  onAdd(item: PublicClothing): void;
}) {
  const [category, setCategory] = useState<ClothingCategory | 'all'>('all');
  const visible =
    category === 'all'
      ? items
      : items.filter((item) => item.category === category);

  return (
    <View className="tryon-catalog">
      <Text className="tryon-catalog__title">可选入库衣物</Text>
      <ScrollView
        className="tryon-catalog__filters"
        scrollX
        showScrollbar={false}
      >
        <View className="tryon-catalog__filters-inner">
          {categories.map((item) => (
            <Button
              key={item.value}
              className={category === item.value ? 'is-active' : ''}
              onClick={() => setCategory(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </View>
      </ScrollView>
      {visible.length === 0 ? (
        <Text className="tryon-catalog__empty">无可用类别衣服</Text>
      ) : (
        <ScrollView
          className="tryon-catalog__items"
          scrollX
          showScrollbar={false}
        >
          <View className="tryon-catalog__items-inner">
            {visible.map((item) => (
              <View
                key={item.id}
                className="tryon-catalog__item"
                onClick={() => onAdd(item)}
              >
                <Image
                  src={item.processedFileId ?? item.sourceFileId}
                  mode="aspectFit"
                />
                <Text>{item.name}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
