import { Button, Image, Text, View } from '@tarojs/components';

import './HomeHeader.scss';

interface Props {
  nickname: string;
  avatarFileId?: string;
  isGuest?: boolean;
  onOpenProfile(): void;
}

export function HomeHeader({
  avatarFileId,
  isGuest = false,
  onOpenProfile,
}: Props) {
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
        aria-label={isGuest ? '登录后进入用户中心' : '打开用户中心'}
        onClick={onOpenProfile}
      >
        {avatarFileId ? (
          <Image
            className="home-header__avatar"
            src={avatarFileId}
            mode="aspectFill"
          />
        ) : (
          <Image
            className="home-header__avatar"
            src="/assets/icons/profile-default.svg"
            mode="aspectFill"
          />
        )}
      </Button>
    </View>
  );
}
