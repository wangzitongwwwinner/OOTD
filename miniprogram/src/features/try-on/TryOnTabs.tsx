import { Button, View } from '@tarojs/components';

export type TryOnTab = 'canvas' | 'outfits';

export function TryOnTabs({
  value,
  onChange,
}: {
  value: TryOnTab;
  onChange(value: TryOnTab): void;
}) {
  return (
    <View className="tryon-tabs">
      <Button
        className={value === 'canvas' ? 'is-active' : ''}
        onClick={() => onChange('canvas')}
      >
        试衣间
      </Button>
      <Button
        className={value === 'outfits' ? 'is-active' : ''}
        onClick={() => onChange('outfits')}
      >
        我的搭配
      </Button>
    </View>
  );
}
