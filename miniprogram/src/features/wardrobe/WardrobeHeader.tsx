import { Button, Text, View } from '@tarojs/components';

import './WardrobeHeader.scss';

export function WardrobeHeader({
  count,
  onAdd,
}: {
  count: number;
  onAdd: () => void;
}) {
  return (
    <View className="wardrobe-header">
      <View>
        <Text className="wardrobe-header__title">我的衣橱</Text>
        <Text className="wardrobe-header__meta">
          {count} 件衣物 · 最近更新 今天
        </Text>
      </View>
      <Button
        className="wardrobe-header__add"
        aria-label="录入衣物"
        onClick={onAdd}
      >
        <Text className="wardrobe-header__plus">＋</Text>
        <Text>录入衣物</Text>
      </Button>
    </View>
  );
}
