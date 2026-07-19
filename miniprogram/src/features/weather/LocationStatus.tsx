import Taro from '@tarojs/taro';
import { Button, Text, View } from '@tarojs/components';
import { useState } from 'react';

import {
  LocationError,
  locationService,
  type CityLocation,
} from './location-service';
import './LocationStatus.scss';

interface Props {
  service?: Pick<typeof locationService, 'restore' | 'locate'>;
  onOpenSettings?: () => boolean | void | Promise<boolean | void>;
  onLocated?: (city: CityLocation) => void;
}

export function LocationStatus({
  service = locationService,
  onOpenSettings = async () => {
    const settings = await Taro.openSetting();
    return settings.authSetting['scope.userLocation'] === true;
  },
  onLocated,
}: Props) {
  const [city, setCity] = useState<CityLocation | undefined>(() =>
    service.restore(),
  );
  const [status, setStatus] = useState<
    'idle' | 'locating' | 'denied' | 'system_disabled' | 'unavailable'
  >('idle');
  const [message, setMessage] = useState('');

  async function locate() {
    if (status === 'locating') return;
    setStatus('locating');
    setMessage('');
    try {
      const located = await service.locate();
      setCity(located);
      onLocated?.(located);
      setStatus('idle');
    } catch (cause) {
      const error =
        cause instanceof LocationError
          ? cause
          : new LocationError('unavailable', '暂时无法获取定位，请稍后重试');
      setStatus(error.kind);
      setMessage(error.message);
    }
  }

  async function openSettings() {
    try {
      if (await onOpenSettings()) {
        setStatus('idle');
        setMessage('');
      }
    } catch {
      // 保留当前提示，允许用户再次打开设置。
    }
  }

  if (city) {
    return (
      <View className="location-status location-status--located">
        <Text className="location-status__pin">⌖</Text>
        <Text className="location-status__city">{city.cityName}</Text>
        <View className="location-status__divider" />
        <Text className="location-status__source">微信定位</Text>
      </View>
    );
  }

  return (
    <View className="location-status">
      <Text className="location-status__purpose">
        用于识别所在城市并提供当地天气
      </Text>
      {message ? (
        <Text className="location-status__error">{message}</Text>
      ) : null}
      {status === 'denied' ? (
        <Button
          className="location-status__action"
          onClick={() => void openSettings()}
        >
          打开设置
        </Button>
      ) : (
        <Button
          className={`location-status__action${
            status === 'locating' ? ' location-status__action--locating' : ''
          }`}
          aria-disabled={status === 'locating'}
          onClick={() => void locate()}
        >
          {status === 'locating' ? (
            <View className="location-status__spinner" aria-hidden="true" />
          ) : null}
          <Text
            className="location-status__action-text"
            style={status === 'locating' ? { color: '#1a1c1b' } : undefined}
          >
            {status === 'locating' ? '定位中…' : '启用微信定位'}
          </Text>
        </Button>
      )}
    </View>
  );
}
