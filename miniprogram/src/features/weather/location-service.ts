import Taro from '@tarojs/taro';

export interface CityLocation {
  cityCode: string;
  cityName: string;
}

type LocationErrorKind = 'denied' | 'system_disabled' | 'unavailable';

export class LocationError extends Error {
  constructor(
    public readonly kind: LocationErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'LocationError';
  }
}

interface Dependencies {
  locate(): Promise<{ latitude: number; longitude: number }>;
  resolve(input: { latitude: number; longitude: number }): Promise<unknown>;
  cache: {
    restore(): CityLocation | undefined;
    save(city: CityLocation): void;
    clear(): void;
  };
}

export function createLocationService(dependencies: Dependencies) {
  return {
    restore: () => dependencies.cache.restore(),
    async locate(): Promise<CityLocation> {
      let coordinates: { latitude: number; longitude: number };
      try {
        coordinates = await dependencies.locate();
      } catch (cause) {
        throw classifyLocationFailure(cause);
      }
      let result: unknown;
      try {
        result = await dependencies.resolve(coordinates);
      } catch {
        throw new LocationError('unavailable', '网络连接失败，请稍后重试');
      }
      if (isFailureEnvelope(result)) {
        throw new LocationError('unavailable', result.error.message);
      }
      if (!isSuccessEnvelope(result) || !isCity(result.data)) {
        throw new LocationError('unavailable', '城市响应异常，请稍后重试');
      }
      dependencies.cache.save(result.data);
      return result.data;
    },
  };
}

const CACHE_KEY = 'chuanyiyoushu.location.city';

const cityCache = {
  restore(): CityLocation | undefined {
    const value: unknown = Taro.getStorageSync(CACHE_KEY);
    return isCity(value) ? value : undefined;
  },
  save(city: CityLocation) {
    Taro.setStorageSync(CACHE_KEY, city);
  },
  clear() {
    Taro.removeStorageSync(CACHE_KEY);
  },
};

export const locationService = createLocationService({
  async locate() {
    const result = await Taro.getLocation({ type: 'gcj02' });
    return { latitude: result.latitude, longitude: result.longitude };
  },
  async resolve(body) {
    const response = await Taro.cloud.callFunction({
      name: 'api',
      data: { method: 'POST', path: '/v1/location/city', body },
    });
    return response.result;
  },
  cache: cityCache,
});

function classifyLocationFailure(cause: unknown): LocationError {
  const message =
    isRecord(cause) && typeof cause.errMsg === 'string'
      ? cause.errMsg
      : cause instanceof Error
        ? cause.message
        : '';
  if (/system permission denied/i.test(message)) {
    return new LocationError(
      'system_disabled',
      '系统定位服务未开启，请开启后重试',
    );
  }
  if (/auth deny|authorize:fail/i.test(message)) {
    return new LocationError('denied', '未获得定位权限，请在设置中允许后重试');
  }
  return new LocationError('unavailable', '暂时无法获取定位，请稍后重试');
}

function isCity(value: unknown): value is CityLocation {
  return (
    isRecord(value) &&
    typeof value.cityCode === 'string' &&
    typeof value.cityName === 'string'
  );
}

function isSuccessEnvelope(value: unknown): value is { data: unknown } {
  return isRecord(value) && 'data' in value;
}

function isFailureEnvelope(
  value: unknown,
): value is { error: { message: string } } {
  return (
    isRecord(value) &&
    isRecord(value.error) &&
    typeof value.error.message === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
