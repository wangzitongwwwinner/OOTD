import Taro from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
import { useEffect, useState } from 'react';

import { LoginPage } from '../../features/auth/LoginPage';
import { useAuthSession } from '../../features/auth/useAuthSession';
import { ProfilePreference } from '../../features/profile/ProfilePreference';
import { LocationStatus } from '../../features/weather/LocationStatus';
import { locationService } from '../../features/weather/location-service';
import { WeatherCard } from '../../features/weather/WeatherCard';
import { TodayItinerary } from '../../features/itinerary/TodayItinerary';
import { RecommendationCard } from '../../features/recommendation/RecommendationCard';

import './index.scss';

const AGREEMENT_VERSION = '2026-07-18';

export default function IndexPage() {
  const auth = useAuthSession();
  const [city, setCity] = useState(() => locationService.restore());

  useEffect(() => {
    if (auth.status === 'authenticated') {
      void Taro.showTabBar();
    } else {
      void Taro.hideTabBar();
    }
  }, [auth.status]);

  if (auth.status === 'restoring') {
    return (
      <View className="session-loading">
        <Text>正在恢复登录状态…</Text>
      </View>
    );
  }

  if (auth.status !== 'authenticated') {
    return (
      <LoginPage
        status={auth.status}
        error={auth.error}
        onLogin={() =>
          auth.login({
            userAgreementVersion: AGREEMENT_VERSION,
            privacyPolicyVersion: AGREEMENT_VERSION,
            acceptedAt: new Date().toISOString(),
          })
        }
        onOpenLegal={(document) => {
          void Taro.showModal({
            title: document === 'agreement' ? '用户协议' : '隐私政策',
            content:
              document === 'agreement'
                ? '使用穿衣有数即表示你同意遵守平台规则，并对提交内容负责。'
                : '穿衣有数仅在提供功能所需范围内处理你的账号与使用数据。',
            showCancel: false,
            confirmText: '我知道了',
          });
        }}
      />
    );
  }

  return (
    <View className="home-placeholder">
      <Text className="home-placeholder__eyebrow">TODAY</Text>
      <LocationStatus onLocated={setCity} />
      {city ? <WeatherCard key={city.cityCode} city={city} /> : null}
      {city ? (
        <RecommendationCard
          key={`recommendation-${city.cityCode}`}
          city={city}
        />
      ) : null}
      <Text className="home-placeholder__title">
        你好，{auth.session?.user.nickname}
      </Text>
      <Text className="home-placeholder__copy">
        综合全天行程，编排穿脱方案…
      </Text>
      <ProfilePreference />
      <TodayItinerary />
    </View>
  );
}
