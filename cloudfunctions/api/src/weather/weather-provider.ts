import type {
  CurrentWeatherRequest,
  WeatherInfo,
} from '../../../../packages/contracts/src/index.ts';

export interface WeatherProvider {
  getCurrent(input: CurrentWeatherRequest): Promise<WeatherInfo>;
}

export interface WeatherCache {
  weather: WeatherInfo;
  expiresAt: string;
}

export interface WeatherCacheRepository {
  find(cityCode: string): Promise<WeatherCache | undefined>;
  save(cache: WeatherCache): Promise<void>;
}
