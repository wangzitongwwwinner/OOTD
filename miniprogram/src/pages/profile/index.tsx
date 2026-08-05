import { Button, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useMemo, useState } from 'react';

import { useAuth } from '../../features/auth/AuthGate';
import { ProfileCenter } from '../../features/profile/ProfileCenter';
import { ProfilePreference } from '../../features/profile/ProfilePreference';
import type { Profile } from '../../features/profile/profile-service';

import './index.scss';

const FEEL_LABELS = {
  cold: '偏冷',
  comfortable: '舒适',
  stuffy: '闷热',
  cool: '微凉',
} as const;

export default function ProfilePage() {
  const auth = useAuth();
  const [liveProfile, setLiveProfile] = useState<Profile>();
  const navigation = useMemo(() => {
    try {
      const capsule = Taro.getMenuButtonBoundingClientRect();
      const windowInfo = Taro.getWindowInfo();
      const statusBarHeight = windowInfo.statusBarHeight ?? capsule.top;
      return {
        paddingTop: `${statusBarHeight}px`,
        height: `${Math.max(
          capsule.height + (capsule.top - statusBarHeight) * 2,
          44,
        )}px`,
      };
    } catch {
      return { paddingTop: 'env(safe-area-inset-top)', height: '44px' };
    }
  }, []);
  if (auth.status === 'restoring') return <Text>正在加载资料…</Text>;
  if (!auth.session) return <Text>登录状态已失效，请返回首页重新登录</Text>;
  const profile = liveProfile ?? auth.session.user;
  return (
    <View className="profile-page">
      <View
        className="profile-page__header"
        style={{ paddingTop: navigation.paddingTop }}
      >
        <View
          className="profile-page__header-inner"
          style={{ height: navigation.height }}
        >
          <Button aria-label="返回" onClick={() => void Taro.navigateBack()}>
            ←
          </Button>
          <Text>个人设置 &amp; 偏好</Text>
          <View />
        </View>
      </View>
      <ProfileCenter
        nickname={profile.nickname}
        avatarFileId={profile.avatarFileId}
        recentFeelLabel={FEEL_LABELS[profile.recentFeelPreference]}
        profileVersion={profile.version}
        onProfileChange={(nextProfile) => {
          setLiveProfile(nextProfile);
          auth.updateUser(nextProfile);
        }}
        preferenceSlot={<ProfilePreference onProfileChange={setLiveProfile} />}
        onLogout={auth.logout}
      />
    </View>
  );
}
