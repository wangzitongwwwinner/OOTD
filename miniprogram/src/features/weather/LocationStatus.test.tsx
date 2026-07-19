import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { LocationError } from './location-service';
import { LocationStatus } from './LocationStatus';

const city = { cityCode: '101020100', cityName: '上海' };

it('城市缓存存在时展示只读城市与微信定位', () => {
  render(
    <LocationStatus
      service={{ restore: () => city, locate: vi.fn() }}
      onOpenSettings={vi.fn()}
    />,
  );
  expect(screen.getByText('上海')).toBeInTheDocument();
  expect(screen.getByText('微信定位')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /切换城市/ }),
  ).not.toBeInTheDocument();
});

it('说明用途后由用户主动触发首次定位', async () => {
  const locate = vi.fn().mockResolvedValue(city);
  render(
    <LocationStatus
      service={{ restore: () => undefined, locate }}
      onOpenSettings={vi.fn()}
    />,
  );
  expect(
    screen.getByText('用于识别所在城市并提供当地天气'),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '启用微信定位' }));
  await waitFor(() => expect(locate).toHaveBeenCalledTimes(1));
  expect(await screen.findByText('上海')).toBeInTheDocument();
});

it('定位请求期间展示自定义加载效果、黑色文字并禁止重复点击', async () => {
  let finishLocate!: (value: typeof city) => void;
  const locate = vi.fn(
    () =>
      new Promise<typeof city>((resolve) => {
        finishLocate = resolve;
      }),
  );
  const { container } = render(
    <LocationStatus
      service={{ restore: () => undefined, locate }}
      onOpenSettings={vi.fn()}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: '启用微信定位' }));

  const locatingButton = screen.getByRole('button', { name: '定位中…' });
  expect(locatingButton).toHaveAttribute('aria-disabled', 'true');
  expect(locatingButton).toHaveClass('location-status__action--locating');
  expect(
    container.querySelector('.location-status__spinner'),
  ).toBeInTheDocument();
  expect(screen.getByText('定位中…')).toHaveStyle({ color: '#1a1c1b' });

  fireEvent.click(locatingButton);
  expect(locate).toHaveBeenCalledTimes(1);

  finishLocate(city);
  expect(await screen.findByText('上海')).toBeInTheDocument();
});

it('拒绝授权后在设置中开启权限会恢复定位按钮', async () => {
  const onOpenSettings = vi.fn().mockResolvedValue(true);
  render(
    <LocationStatus
      service={{
        restore: () => undefined,
        locate: vi
          .fn()
          .mockRejectedValue(
            new LocationError('denied', '未获得定位权限，请在设置中允许后重试'),
          ),
      }}
      onOpenSettings={onOpenSettings}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '启用微信定位' }));
  expect(
    await screen.findByText('未获得定位权限，请在设置中允许后重试'),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '打开设置' }));
  expect(onOpenSettings).toHaveBeenCalledTimes(1);
  expect(
    await screen.findByRole('button', { name: '启用微信定位' }),
  ).toBeInTheDocument();
});
