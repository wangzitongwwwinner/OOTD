import { Text, View } from '@tarojs/components';

import { AuthenticatedPage } from '../../features/auth/AuthenticatedPage';

import './index.scss';

export default function TryOnPage() {
  return (
    <AuthenticatedPage>
      <View className="feature-placeholder">
        <Text className="feature-placeholder__eyebrow">TRY ON</Text>
        <Text className="feature-placeholder__title">试穿</Text>
        <Text className="feature-placeholder__copy">功能开发中</Text>
      </View>
    </AuthenticatedPage>
  );
}
