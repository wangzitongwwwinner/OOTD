import Taro from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
import { useEffect, useState } from 'react';

import { LoginPage } from '../../features/auth/LoginPage';
import { useAuthSession } from '../../features/auth/useAuthSession';
import { LEGAL_VERSION_ID } from '../../features/legal/legal-content';
import { HomeHeader } from '../../features/home/HomeHeader';
import { LocationStatus } from '../../features/weather/LocationStatus';
import { locationService } from '../../features/weather/location-service';
import { WeatherCard } from '../../features/weather/WeatherCard';
import { TodayItinerary } from '../../features/itinerary/TodayItinerary';
import { RecommendationCard } from '../../features/recommendation/RecommendationCard';
import {
  shouldRequestWechatProfile,
  WechatProfileSetup,
} from '../../features/profile/WechatProfileSetup';
import { setTabBarAuthenticated } from '../../custom-tab-bar/visibility';
import { useSyncTabBar } from '../../custom-tab-bar/active-tab';

import './index.scss';

export default function IndexPage() {
  useSyncTabBar('home');
  const auth = useAuthSession();
  const [city, setCity] = useState(() => locationService.restore());
  const [profileSetupHandledUserId, setProfileSetupHandledUserId] =
    useState('');

  useEffect(() => {
    setTabBarAuthenticated(auth.status === 'authenticated');
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
            userAgreementVersion: LEGAL_VERSION_ID,
            privacyPolicyVersion: LEGAL_VERSION_ID,
            acceptedAt: new Date().toISOString(),
          })
        }
        onOpenLegal={(document) => {
          void Taro.navigateTo({
            url: `/pages/legal/index?document=${document}`,
          });
        }}
      />
    );
  }

  return (
    <View className="home-page">
      {auth.session &&
      profileSetupHandledUserId !== auth.session.user.id &&
      shouldRequestWechatProfile(auth.session.user) ? (
        <WechatProfileSetup
          profile={auth.session.user}
          onComplete={(profile) => {
            setProfileSetupHandledUserId(profile.id);
            auth.updateUser(profile);
          }}
          onSkip={() =>
            setProfileSetupHandledUserId(auth.session?.user.id ?? '')
          }
        />
      ) : null}
      <HomeHeader
        nickname={auth.session?.user.nickname ?? '我'}
        avatarFileId={auth.session?.user.avatarFileId}
        onOpenProfile={() =>
          void Taro.navigateTo({ url: '/pages/profile/index' })
        }
      />
      <View className="home-page__content">
        {city ? null : <LocationStatus onLocated={setCity} />}
        {city ? <WeatherCard key={city.cityCode} city={city} /> : null}
        {city ? (
          <RecommendationCard
            key={`recommendation-${city.cityCode}`}
            city={city}
          />
        ) : null}
        <TodayItinerary />
      </View>
    </View>
  );
}
