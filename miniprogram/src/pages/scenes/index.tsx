import { Text, View } from '@tarojs/components';

import { AuthenticatedPage } from '../../features/auth/AuthenticatedPage';
import { SceneList } from '../../features/scenes/SceneList';

import './index.scss';

export default function ScenesPage() {
  return (
    <AuthenticatedPage>
      <View className="scenes-page">
        <Text className="scenes-page__eyebrow">SCENE LIBRARY</Text>
        <Text className="scenes-page__title">场景记忆</Text>
        <Text className="scenes-page__description">
          记录你在不同空间里感到舒适的温度与体感。
        </Text>
        <SceneList />
      </View>
    </AuthenticatedPage>
  );
}
