import { describe, expect, it, vi } from 'vitest';

import { createWeatherService } from './weather-service';

const weather = {
  cityCode: '101020100',
  cityName: '上海',
  localDate: '2026-07-20',
  condition: '多云',
  temperatureCelsius: 31,
  feelsLikeCelsius: 35,
  humidityPercent: 68,
  highCelsius: 34,
  lowCelsius: 27,
  uvIndex: 7,
  windSpeedKilometersPerHour: 14,
  observedAt: '2026-07-20T02:00:00.000Z',
  source: 'qweather' as const,
  isStale: false,
};

describe('weather service', () => {
  it('使用城市级信息读取天气并支持强制刷新', async () => {
    const call = vi.fn().mockResolvedValue({ data: weather });
    const service = createWeatherService(call);
    await expect(
      service.get({ cityCode: '101020100', cityName: '上海' }, true),
    ).resolves.toEqual(weather);
    expect(call).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/weather/current',
      body: { cityCode: '101020100', cityName: '上海', refresh: true },
    });
  });

  it('网络和异常响应只显示可读错误', async () => {
    const network = createWeatherService(vi.fn().mockRejectedValue('secret'));
    await expect(
      network.get({ cityCode: '101020100', cityName: '上海' }),
    ).rejects.toThrow('网络连接失败，请稍后重试');

    const invalid = createWeatherService(
      vi.fn().mockResolvedValue({ data: { cityName: '上海' } }),
    );
    await expect(
      invalid.get({ cityCode: '101020100', cityName: '上海' }),
    ).rejects.toThrow('天气响应异常，请稍后重试');
  });
});
