import Taro from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
import { type PropsWithChildren, useEffect, useState } from 'react';

import { restoreAuthSession } from './auth-service';

export function AuthenticatedPage({ children }: PropsWithChildren) {
  const [authenticated] = useState(() => Boolean(restoreAuthSession()));

  useEffect(() => {
    if (!authenticated) {
      void Taro.switchTab({ url: '/pages/index/index' });
    }
  }, [authenticated]);

  if (!authenticated) {
    return (
      <View className="authenticated-page__loading">
        <Text>正在返回登录页…</Text>
      </View>
    );
  }

  return <>{children}</>;
}
