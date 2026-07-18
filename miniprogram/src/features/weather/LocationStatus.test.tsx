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

it('拒绝授权后提供设置入口', async () => {
  const onOpenSettings = vi.fn();
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
});
