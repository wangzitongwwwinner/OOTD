import Taro from '@tarojs/taro';
import { View } from '@tarojs/components';
import { useState } from 'react';

import { AuthLoginModal, useAuth } from '../../features/auth/AuthGate';
import { HomeHeader } from '../../features/home/HomeHeader';
import { LocationStatus } from '../../features/weather/LocationStatus';
import { locationService } from '../../features/weather/location-service';
import { WeatherCard } from '../../features/weather/WeatherCard';
import { TodayItinerary } from '../../features/itinerary/TodayItinerary';
import { RecommendationCard } from '../../features/recommendation/RecommendationCard';
import { useSyncTabBar } from '../../custom-tab-bar/active-tab';

import './index.scss';

export default function IndexPage() {
  useSyncTabBar('home');
  const auth = useAuth();
  const [city, setCity] = useState(() => locationService.restore());

  return (
    <View className="home-page">
      <HomeHeader
        nickname={auth.session?.user.nickname ?? '我'}
        avatarFileId={auth.session?.user.avatarFileId}
        isGuest={auth.status !== 'authenticated'}
        onOpenProfile={() =>
          auth.requestLogin({
            title: '登录后进入用户中心',
            description: '登录后可查看和管理您的个人资料，当前首页会为您保留。',
            action: async () => {
              await Taro.navigateTo({ url: '/pages/profile/index' });
            },
          })
        }
      />
      <View className="home-page__content">
        {city ? null : <LocationStatus onLocated={setCity} />}
        {city ? <WeatherCard key={city.cityCode} city={city} /> : null}
        <RecommendationCard
          key={`recommendation-${city?.cityCode ?? 'generic'}`}
          city={city}
        />
        <TodayItinerary />
      </View>
      <AuthLoginModal />
    </View>
  );
}
