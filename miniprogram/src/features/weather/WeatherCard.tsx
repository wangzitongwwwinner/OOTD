import { Button, Text, View } from '@tarojs/components';
import { useCallback, useEffect, useState } from 'react';

import type { CityLocation } from './location-service';
import { weatherService, type WeatherInfo } from './weather-service';
import './WeatherCard.scss';

interface Props {
  city: CityLocation;
  service?: Pick<typeof weatherService, 'get'>;
}

export function WeatherCard({ city, service = weatherService }: Props) {
  const [weather, setWeather] = useState<WeatherInfo>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (refresh = false) => {
      if (loading && !refresh) return;
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        setWeather(await service.get(city, refresh));
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : '天气服务暂时不可用，请稍后重试',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [city, loading, service],
  );

  useEffect(() => {
    let active = true;
    service.get(city).then(
      (result) => {
        if (!active) return;
        setWeather(result);
        setLoading(false);
      },
      (cause: unknown) => {
        if (!active) return;
        setError(
          cause instanceof Error
            ? cause.message
            : '天气服务暂时不可用，请稍后重试',
        );
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, [city, service]);

  if (loading && !weather) {
    return <Text className="weather-card__status">正在加载天气…</Text>;
  }

  if (!weather) {
    return (
      <View className="weather-card weather-card--error">
        <Text className="weather-card__error">{error}</Text>
        <Button className="weather-card__retry" onClick={() => void load()}>
          重试
        </Button>
      </View>
    );
  }

  return (
    <View className="weather-card">
      <View className="weather-card__header">
        <View>
          <Text className="weather-card__date">{weather.localDate}</Text>
          <Text className="weather-card__source">
            {weather.isStale ? '和风天气 · 缓存数据' : '和风天气'}
          </Text>
        </View>
        <Button
          className="weather-card__refresh"
          disabled={refreshing}
          onClick={() => void load(true)}
        >
          {refreshing ? '刷新中…' : '刷新天气'}
        </Button>
      </View>
      <View className="weather-card__main">
        <Text className="weather-card__temperature">
          {weather.temperatureCelsius}°
        </Text>
        <View>
          <Text className="weather-card__condition">{weather.condition}</Text>
          <Text className="weather-card__feels">
            体感 {weather.feelsLikeCelsius}°
          </Text>
        </View>
      </View>
      <Text className="weather-card__range">
        最高 {weather.highCelsius}° / 最低 {weather.lowCelsius}°
      </Text>
      <View className="weather-card__details">
        {weather.humidityPercent === undefined ? null : (
          <Text>湿度 {weather.humidityPercent}%</Text>
        )}
        {weather.uvIndex === undefined ? null : (
          <Text>紫外线 {weather.uvIndex}</Text>
        )}
        {weather.windSpeedKilometersPerHour === undefined ? null : (
          <Text>风速 {weather.windSpeedKilometersPerHour} km/h</Text>
        )}
      </View>
      {error ? <Text className="weather-card__error">{error}</Text> : null}
    </View>
  );
}
