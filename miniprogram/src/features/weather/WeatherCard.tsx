import { Button, Text, View } from '@tarojs/components';
import { useCallback, useEffect, useState } from 'react';

import type { CityLocation } from './location-service';
import { weatherService, type WeatherInfo } from './weather-service';
import './WeatherCard.scss';

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}月${date.getDate()}日星期${
    '日一二三四五六'[date.getDay()]
  }`;
}

function uvLabel(value?: number) {
  if (value === undefined) return '未知';
  if (value <= 2) return '弱';
  if (value <= 5) return '中等';
  if (value <= 7) return '较强';
  return '强';
}

function windLevel(speed?: number) {
  if (speed === undefined) return '未知';
  const level =
    speed <= 1 ? 0 : speed <= 5 ? 1 : speed <= 11 ? 2 : speed <= 19 ? 3 : 4;
  return `${level <= 3 ? '微风' : '和风'} ${level}级`;
}

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
        <View className="weather-card__city">
          <Text className="weather-card__pin">⌖</Text>
          <Text className="weather-card__city-name">{city.cityName}</Text>
          <View className="weather-card__city-divider" />
          <Text className="weather-card__location-source">微信定位</Text>
        </View>
        <View className="weather-card__header-actions">
          <Text className="weather-card__source">
            {weather.isStale ? '和风天气 · 缓存数据' : '和风天气实时同步'}
          </Text>
          <Button
            className="weather-card__refresh"
            aria-label={refreshing ? '刷新中…' : '刷新天气'}
            disabled={refreshing}
            onClick={() => void load(true)}
          >
            {refreshing ? '…' : '↻'}
          </Button>
        </View>
      </View>
      <View className="weather-card__main">
        <View>
          <Text className="weather-card__date">
            {formatDate(weather.localDate)}
          </Text>
          <Text className="weather-card__temperature">
            {weather.temperatureCelsius}°C
          </Text>
          <Text className="weather-card__condition">{weather.condition}</Text>
        </View>
        <View className="weather-card__summary">
          <View className="weather-card__stat">
            <Text className="weather-card__stat-label">体感温:</Text>
            <Text className="weather-card__stat-value">
              {weather.feelsLikeCelsius}°C
            </Text>
          </View>
          <View className="weather-card__stat">
            <Text className="weather-card__stat-label">全温差:</Text>
            <Text className="weather-card__stat-value">
              {weather.lowCelsius}°C ~ {weather.highCelsius}°C
            </Text>
          </View>
          <View className="weather-card__stat">
            <Text className="weather-card__stat-label">紫外线:</Text>
            <Text className="weather-card__stat-value">
              {uvLabel(weather.uvIndex)}
            </Text>
          </View>
          <View className="weather-card__stat">
            <Text className="weather-card__stat-label">风速级:</Text>
            <Text className="weather-card__stat-value">
              {windLevel(weather.windSpeedKilometersPerHour)}
            </Text>
          </View>
        </View>
      </View>
      {error ? <Text className="weather-card__error">{error}</Text> : null}
    </View>
  );
}
