import { Button, Image, Text, View } from '@tarojs/components';

import './HomeHeader.scss';

interface Props {
  nickname: string;
  avatarFileId?: string;
  onOpenProfile(): void;
}

export function HomeHeader({ avatarFileId, onOpenProfile }: Props) {
  return (
    <View className="home-header">
      <View className="home-header__brand">
        <Image
          className="home-header__brand-icon"
          src="/assets/tabbar/home.svg"
          mode="aspectFit"
        />
        <Text className="home-header__brand-name">今天穿什么</Text>
      </View>
      <Button
        className="home-header__profile"
        aria-label="打开用户中心"
        onClick={onOpenProfile}
      >
        {avatarFileId ? (
          <Image
            className="home-header__avatar"
            src={avatarFileId}
            mode="aspectFill"
          />
        ) : (
          <Text className="home-header__avatar-fallback">⌑</Text>
        )}
      </Button>
    </View>
  );
}
