import {
  weatherInfoSchema,
  type CurrentWeatherRequest,
  type WeatherInfo,
} from '../../../../packages/contracts/src/index.ts';

import type { WeatherProvider } from './weather-provider.ts';

interface QWeatherConfig {
  host: string;
  apiKey: string;
}

type Fetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export class QWeatherProvider implements WeatherProvider {
  private readonly baseUrl: URL;

  constructor(
    private readonly config: QWeatherConfig,
    private readonly fetcher: Fetch = fetch,
  ) {
    if (!config.apiKey.trim()) throw new Error('Missing QWeather API key');
    const normalized = config.host.startsWith('https://')
      ? config.host
      : `https://${config.host}`;
    this.baseUrl = new URL(normalized);
    if (this.baseUrl.protocol !== 'https:' || this.baseUrl.pathname !== '/') {
      throw new Error('Invalid QWeather API host');
    }
  }

  async getCurrent(input: CurrentWeatherRequest): Promise<WeatherInfo> {
    const [nowPayload, forecastPayload] = await Promise.all([
      this.request('/v7/weather/now', input.cityCode),
      this.request('/v7/weather/3d', input.cityCode),
    ]);
    assertSuccessfulPayload(nowPayload, 'now');
    assertSuccessfulPayload(forecastPayload, 'forecast');
    if (
      !isRecord(nowPayload.now) ||
      typeof nowPayload.updateTime !== 'string' ||
      !Array.isArray(forecastPayload.daily) ||
      !isRecord(forecastPayload.daily[0])
    ) {
      throw new Error('Invalid QWeather response');
    }

    const current = nowPayload.now;
    const daily = forecastPayload.daily[0];
    const humidityPercent = optionalNumberFrom(current.humidity);
    const uvIndex = optionalNumberFrom(daily.uvIndex);
    const windSpeedKilometersPerHour = optionalNumberFrom(current.windSpeed);
    return weatherInfoSchema.parse({
      cityCode: input.cityCode,
      cityName: input.cityName,
      localDate: daily.fxDate,
      condition: current.text,
      temperatureCelsius: numberFrom(current.temp),
      feelsLikeCelsius: numberFrom(current.feelsLike),
      ...(humidityPercent === undefined ? {} : { humidityPercent }),
      highCelsius: numberFrom(daily.tempMax),
      lowCelsius: numberFrom(daily.tempMin),
      ...(uvIndex === undefined ? {} : { uvIndex }),
      ...(windSpeedKilometersPerHour === undefined
        ? {}
        : { windSpeedKilometersPerHour }),
      observedAt: new Date(nowPayload.updateTime).toISOString(),
      source: 'qweather',
      isStale: false,
    });
  }

  private async request(path: string, cityCode: string): Promise<unknown> {
    const url = new URL(path, this.baseUrl);
    url.searchParams.set('location', cityCode);
    url.searchParams.set('lang', 'zh');
    url.searchParams.set('unit', 'm');

    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await this.fetcher(url, {
          headers: { 'X-QW-Api-Key': this.config.apiKey },
          signal: AbortSignal.timeout(2000),
        });
        if (!response.ok) {
          throw new Error(`QWeather ${path} HTTP ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error('QWeather request failed');
  }
}

function numberFrom(value: unknown): number {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error('Invalid numeric weather field');
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error('Invalid numeric weather field');
  return parsed;
}

function optionalNumberFrom(value: unknown): number | undefined {
  return value === undefined || value === null || value === ''
    ? undefined
    : numberFrom(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assertSuccessfulPayload(
  payload: unknown,
  endpoint: 'now' | 'forecast',
): asserts payload is Record<string, unknown> {
  if (!isRecord(payload)) throw new Error(`Invalid QWeather ${endpoint} response`);
  if (payload.code !== '200') {
    throw new Error(
      `QWeather ${endpoint} code ${typeof payload.code === 'string' ? payload.code : 'unknown'}`,
    );
  }
}
