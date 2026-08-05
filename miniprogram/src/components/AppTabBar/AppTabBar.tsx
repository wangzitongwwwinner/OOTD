import Taro from '@tarojs/taro';
import { Button, Image, Text, View } from '@tarojs/components';

import './AppTabBar.scss';

export type AppTab = 'home' | 'scenes' | 'wardrobe' | 'tryon';

const tabs: Array<{
  id: AppTab;
  label: string;
  icon: string;
  url: string;
}> = [
  {
    id: 'home',
    label: '首页',
    icon: '/assets/tabbar/home.svg',
    url: '/pages/index/index',
  },
  {
    id: 'scenes',
    label: '场景库',
    icon: '/assets/tabbar/scenes.svg',
    url: '/pages/scenes/index',
  },
  {
    id: 'wardrobe',
    label: '衣橱',
    icon: '/assets/tabbar/wardrobe.svg',
    url: '/pages/wardrobe/index',
  },
  {
    id: 'tryon',
    label: '试穿',
    icon: '/assets/tabbar/tryon.svg',
    url: '/pages/try-on/index',
  },
];

export function AppTabBar({
  active,
  visible = true,
  onSelect,
}: {
  active: AppTab;
  visible?: boolean;
  onSelect?: (tab: AppTab) => void;
}) {
  if (!visible) return null;

  return (
    <View className="app-tab-bar" aria-label="一级导航">
      <View className="app-tab-bar__inner">
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <Button
              key={tab.id}
              className={`app-tab-bar__item ${selected ? 'is-active' : ''}`}
              aria-label={tab.label}
              aria-current={selected ? 'page' : undefined}
              onClick={() => {
                if (!selected) {
                  onSelect?.(tab.id);
                  void Taro.switchTab({ url: tab.url });
                }
              }}
            >
              <Image
                className="app-tab-bar__icon"
                src={tab.icon}
                mode="aspectFit"
                aria-hidden="true"
              />
              <Text className="app-tab-bar__label">{tab.label}</Text>
            </Button>
          );
        })}
      </View>
    </View>
  );
}
