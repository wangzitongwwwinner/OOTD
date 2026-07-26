import { Text, View } from '@tarojs/components';

import { useAuthSession } from '../../features/auth/useAuthSession';
import { ProfileCenter } from '../../features/profile/ProfileCenter';

import './index.scss';

const FEEL_LABELS = {
  cold: '偏冷',
  comfortable: '舒适',
  stuffy: '闷热',
  cool: '微凉',
} as const;

export default function ProfilePage() {
  const auth = useAuthSession();
  if (auth.status === 'restoring') return <Text>正在加载资料…</Text>;
  if (!auth.session) return <Text>登录状态已失效，请返回首页重新登录</Text>;
  return (
    <View className="profile-page">
      <Text className="profile-page__eyebrow">PROFILE</Text>
      <Text className="profile-page__title">用户中心</Text>
      <ProfileCenter
        nickname={auth.session.user.nickname}
        recentFeelLabel={FEEL_LABELS[auth.session.user.recentFeelPreference]}
        onLogout={auth.logout}
      />
    </View>
  );
}
