import {
  cityLocationSchema,
  type CityLocation,
  type ResolveCityRequest,
} from '../../../../packages/contracts/src/index.ts';

import type { CityResolver } from './city-resolver.ts';

interface QWeatherConfig {
  host: string;
  apiKey: string;
}

type Fetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export class QWeatherCityResolver implements CityResolver {
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

  async resolve(location: ResolveCityRequest): Promise<CityLocation> {
    const url = new URL('/geo/v2/city/lookup', this.baseUrl);
    url.searchParams.set(
      'location',
      `${location.longitude.toFixed(2)},${location.latitude.toFixed(2)}`,
    );
    url.searchParams.set('range', 'cn');
    url.searchParams.set('number', '1');
    url.searchParams.set('lang', 'zh');
    const response = await this.fetcher(url, {
      headers: { 'X-QW-Api-Key': this.config.apiKey },
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) throw new Error('QWeather request failed');
    const payload: unknown = await response.json();
    if (!isRecord(payload) || payload.code !== '200' || !Array.isArray(payload.location)) {
      throw new Error('Invalid QWeather response');
    }
    const first = payload.location[0];
    if (!isRecord(first)) throw new Error('City not found');
    return cityLocationSchema.parse({
      cityCode: first.id,
      cityName: typeof first.adm2 === 'string' && first.adm2 ? first.adm2 : first.name,
    });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
