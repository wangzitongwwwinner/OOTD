import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { LocationError } from './location-service';
import { LocationStatus } from './LocationStatus';

const city = { cityCode: '101020100', cityName: '上海' };

it('未定位时显示通用天气卡且首次渲染不自动请求定位', () => {
  const locate = vi.fn();
  render(<LocationStatus service={{ restore: () => undefined, locate }} />);

  expect(screen.getByText('开启定位后查看当地天气')).toBeInTheDocument();
  expect(screen.getByText('通用天气')).toBeInTheDocument();
  expect(screen.getByText('尚未获取当地天气')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '开启定位' })).toBeInTheDocument();
  expect(locate).not.toHaveBeenCalled();
});

it('游客主动开启定位后加载城市且不需要登录', async () => {
  const locate = vi.fn().mockResolvedValue(city);
  const onLocated = vi.fn();
  render(
    <LocationStatus
      service={{ restore: () => undefined, locate }}
      onLocated={onLocated}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: '开启定位' }));
  await waitFor(() => expect(locate).toHaveBeenCalledTimes(1));
  expect(await screen.findByText('上海')).toBeInTheDocument();
  expect(onLocated).toHaveBeenCalledWith(city);
  expect(screen.queryByText(/登录/)).toBeNull();
});

it('定位期间显示加载状态并阻止重复请求', async () => {
  let finishLocate!: (value: typeof city) => void;
  const locate = vi.fn(
    () =>
      new Promise<typeof city>((resolve) => {
        finishLocate = resolve;
      }),
  );
  const { container } = render(
    <LocationStatus service={{ restore: () => undefined, locate }} />,
  );

  fireEvent.click(screen.getByRole('button', { name: '开启定位' }));
  const locatingButton = screen.getByRole('button', { name: '定位中…' });
  expect(locatingButton).toHaveAttribute('aria-disabled', 'true');
  expect(
    container.querySelector('.location-status__spinner'),
  ).toBeInTheDocument();
  fireEvent.click(locatingButton);
  expect(locate).toHaveBeenCalledTimes(1);

  finishLocate(city);
  expect(await screen.findByText('上海')).toBeInTheDocument();
});

it('拒绝定位后进入设置授权，返回后自动加载当地天气', async () => {
  const locate = vi
    .fn()
    .mockRejectedValueOnce(
      new LocationError('denied', '未获得定位权限，请在设置中允许后重试'),
    )
    .mockResolvedValueOnce(city);
  render(<LocationStatus service={{ restore: () => undefined, locate }} />);

  fireEvent.click(screen.getByRole('button', { name: '开启定位' }));
  expect(
    await screen.findByText('未获得定位权限，请在设置中允许后重试'),
  ).toBeInTheDocument();
  const settings = screen.getByRole('button', { name: '前往设置' });
  expect(settings).toHaveAttribute('data-open-type', 'openSetting');
  expect(screen.getByText('尚未获取当地天气')).toBeInTheDocument();

  fireEvent.doubleClick(settings);
  expect(await screen.findByText('上海')).toBeInTheDocument();
  expect(locate).toHaveBeenCalledTimes(2);
});

it('系统关闭或临时失败后保留开启定位按钮并可重试', async () => {
  const locate = vi
    .fn()
    .mockRejectedValueOnce(
      new LocationError('system_disabled', '系统定位服务未开启，请开启后重试'),
    )
    .mockResolvedValueOnce(city);
  render(<LocationStatus service={{ restore: () => undefined, locate }} />);

  fireEvent.click(screen.getByRole('button', { name: '开启定位' }));
  expect(
    await screen.findByText('系统定位服务未开启，请开启后重试'),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '开启定位' }));
  expect(await screen.findByText('上海')).toBeInTheDocument();
  expect(locate).toHaveBeenCalledTimes(2);
});

it('已有城市缓存时直接显示只读城市且不提供手动切换', () => {
  render(<LocationStatus service={{ restore: () => city, locate: vi.fn() }} />);
  expect(screen.getByText('上海')).toBeInTheDocument();
  expect(screen.getByText('微信定位')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /切换城市/ })).toBeNull();
});
