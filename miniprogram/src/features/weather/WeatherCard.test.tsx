import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { WeatherCard } from './WeatherCard';

const city = { cityCode: '101020100', cityName: '上海' };
const weather = {
  ...city,
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

it('首次加载后展示完整天气字段和来源', async () => {
  const service = { get: vi.fn().mockResolvedValue(weather) };
  render(<WeatherCard city={city} service={service} />);
  expect(screen.getByText('正在加载天气…')).toBeInTheDocument();
  expect(await screen.findByText('31°C')).toBeInTheDocument();
  expect(screen.getByText('上海')).toBeInTheDocument();
  expect(screen.getByText('微信定位')).toBeInTheDocument();
  expect(screen.getByText('多云')).toBeInTheDocument();
  expect(screen.getByText('体感温:')).toBeInTheDocument();
  expect(screen.getByText('全温差:')).toBeInTheDocument();
  expect(screen.getByText('紫外线:')).toBeInTheDocument();
  expect(screen.getByText('风速级:')).toBeInTheDocument();
  expect(screen.getByText('较强')).toBeInTheDocument();
  expect(screen.getByText('和风天气实时同步')).toBeInTheDocument();
});

it('刷新时强制请求且禁止重复点击', async () => {
  let finishRefresh!: (value: typeof weather) => void;
  const service = {
    get: vi
      .fn()
      .mockResolvedValueOnce(weather)
      .mockImplementationOnce(
        () =>
          new Promise<typeof weather>((resolve) => {
            finishRefresh = resolve;
          }),
      ),
  };
  render(<WeatherCard city={city} service={service} />);
  await screen.findByText('31°C');
  fireEvent.click(screen.getByRole('button', { name: '刷新天气' }));
  const refreshing = screen.getByRole('button', { name: '刷新中…' });
  expect(refreshing).toBeDisabled();
  fireEvent.click(refreshing);
  expect(service.get).toHaveBeenCalledTimes(2);
  expect(service.get).toHaveBeenLastCalledWith(city, true);
  finishRefresh(weather);
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: '刷新天气' }),
    ).toBeInTheDocument(),
  );
});

it('无缓存失败时显示重试入口', async () => {
  const service = {
    get: vi.fn().mockRejectedValue(new Error('天气服务暂时不可用，请稍后重试')),
  };
  render(<WeatherCard city={city} service={service} />);
  expect(
    await screen.findByText('天气服务暂时不可用，请稍后重试'),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '重试' })).toBeInTheDocument();
});
