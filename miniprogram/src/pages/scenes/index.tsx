import { Text, View } from '@tarojs/components';

import { AuthenticatedPage } from '../../features/auth/AuthenticatedPage';
import { SceneList } from '../../features/scenes/SceneList';
import { useSyncTabBar } from '../../custom-tab-bar/active-tab';

import './index.scss';

export default function ScenesPage() {
  useSyncTabBar('scenes');
  return (
    <AuthenticatedPage>
      <View className="scenes-page">
        <Text className="scenes-page__title">场景记忆</Text>
        <Text className="scenes-page__description">
          记录您一天的日常生活微气候，在生成搭配建议时为您精确调整。
        </Text>
        <SceneList />
      </View>
    </AuthenticatedPage>
  );
}
