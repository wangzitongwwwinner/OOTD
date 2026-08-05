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
  onLocated?: (city: CityLocation) => void;
}

export function LocationStatus({
  service = locationService,
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

  const locating = status === 'locating';

  return (
    <View className="location-status location-status--placeholder">
      <View className="location-status__header">
        <View className="location-status__city-pill">
          <Text className="location-status__pin">⌖</Text>
          <Text>开启定位后查看当地天气</Text>
        </View>
        <Text className="location-status__generic-badge">通用天气</Text>
      </View>
      <View className="location-status__content">
        <View>
          <Text className="location-status__temperature">--°</Text>
          <Text className="location-status__condition">尚未获取当地天气</Text>
        </View>
        <Text className="location-status__purpose">
          开启定位后，我们只识别所在城市，用于加载当地天气。
        </Text>
      </View>
      {message ? (
        <Text className="location-status__error">{message}</Text>
      ) : null}
      {status === 'denied' ? (
        <Button
          className="location-status__action"
          openType="openSetting"
          onOpenSetting={(event) => {
            if (event.detail.authSetting['scope.userLocation'] === true) {
              setStatus('idle');
              setMessage('');
              void locate();
            }
          }}
        >
          前往设置
        </Button>
      ) : (
        <Button
          className={`location-status__action${
            locating ? ' location-status__action--locating' : ''
          }`}
          aria-disabled={locating}
          onClick={() => void locate()}
        >
          {locating ? (
            <View className="location-status__spinner" aria-hidden="true" />
          ) : null}
          <Text className="location-status__action-text">
            {locating ? '定位中…' : '开启定位'}
          </Text>
        </Button>
      )}
    </View>
  );
}
