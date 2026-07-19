import Taro from '@tarojs/taro';

import type { CityLocation } from './location-service';

export interface WeatherInfo {
  cityCode: string;
  cityName: string;
  localDate: string;
  condition: string;
  temperatureCelsius: number;
  feelsLikeCelsius: number;
  humidityPercent?: number;
  highCelsius: number;
  lowCelsius: number;
  uvIndex?: number;
  windSpeedKilometersPerHour?: number;
  observedAt: string;
  source: 'qweather';
  isStale: boolean;
}

interface WeatherRequest {
  method: 'GET';
  path: '/v1/weather/current';
  body: CityLocation & { refresh?: boolean };
}

type Call = (request: WeatherRequest) => Promise<unknown>;

export function createWeatherService(call: Call) {
  return {
    async get(city: CityLocation, refresh = false): Promise<WeatherInfo> {
      let result: unknown;
      try {
        result = await call({
          method: 'GET',
          path: '/v1/weather/current',
          body: { ...city, ...(refresh ? { refresh: true } : {}) },
        });
      } catch {
        throw new Error('网络连接失败，请稍后重试');
      }
      if (isFailureEnvelope(result)) throw new Error(result.error.message);
      if (!isSuccessEnvelope(result) || !isWeatherInfo(result.data)) {
        throw new Error('天气响应异常，请稍后重试');
      }
      return result.data;
    },
  };
}

export const weatherService = createWeatherService(async (data) => {
  const response = await Taro.cloud.callFunction({ name: 'api', data });
  return response.result;
});

function isWeatherInfo(value: unknown): value is WeatherInfo {
  if (!isRecord(value)) return false;
  return (
    typeof value.cityCode === 'string' &&
    typeof value.cityName === 'string' &&
    typeof value.localDate === 'string' &&
    typeof value.condition === 'string' &&
    typeof value.temperatureCelsius === 'number' &&
    typeof value.feelsLikeCelsius === 'number' &&
    (value.humidityPercent === undefined ||
      typeof value.humidityPercent === 'number') &&
    typeof value.highCelsius === 'number' &&
    typeof value.lowCelsius === 'number' &&
    (value.uvIndex === undefined || typeof value.uvIndex === 'number') &&
    (value.windSpeedKilometersPerHour === undefined ||
      typeof value.windSpeedKilometersPerHour === 'number') &&
    typeof value.observedAt === 'string' &&
    value.source === 'qweather' &&
    typeof value.isStale === 'boolean'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
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
