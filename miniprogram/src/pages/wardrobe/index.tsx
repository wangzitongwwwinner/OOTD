import { Text, View } from '@tarojs/components';

import { AuthenticatedPage } from '../../features/auth/AuthenticatedPage';

import './index.scss';

export default function WardrobePage() {
  return (
    <AuthenticatedPage>
      <View className="feature-placeholder">
        <Text className="feature-placeholder__eyebrow">WARDROBE</Text>
        <Text className="feature-placeholder__title">衣橱</Text>
        <Text className="feature-placeholder__copy">功能开发中</Text>
      </View>
    </AuthenticatedPage>
  );
}
