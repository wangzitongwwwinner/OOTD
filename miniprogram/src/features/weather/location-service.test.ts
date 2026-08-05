import { describe, expect, it, vi } from 'vitest';

import { createLocationService, LocationError } from './location-service';

const city = { cityCode: '101020100', cityName: '上海' };

function dependencies(overrides: Record<string, unknown> = {}) {
  return {
    locate: vi
      .fn()
      .mockResolvedValue({ latitude: 31.2304, longitude: 121.4737 }),
    resolve: vi.fn().mockResolvedValue({ data: city, requestId: 'req_city' }),
    cache: { restore: vi.fn(), save: vi.fn(), clear: vi.fn() },
    ...overrides,
  };
}

describe('location service', () => {
  it('定位后解析城市且缓存中不包含精确坐标', async () => {
    const deps = dependencies();
    const service = createLocationService(deps);
    await expect(service.locate()).resolves.toEqual(city);
    expect(deps.resolve).toHaveBeenCalledWith({
      latitude: 31.2304,
      longitude: 121.4737,
    });
    expect(deps.cache.save).toHaveBeenCalledWith(city);
  });

  it.each([
    ['getLocation:fail auth deny', 'denied'],
    ['getLocation:fail system permission denied', 'system_disabled'],
    ['getLocation:fail timeout', 'unavailable'],
  ] as const)('将 %s 分类为 %s', async (message, kind) => {
    const service = createLocationService(
      dependencies({
        locate: vi.fn().mockRejectedValue({ errMsg: message }),
      }),
    );
    await expect(service.locate()).rejects.toMatchObject({ kind });
  });

  it('真机仅返回 timeout 时使用通用定位失败文案', async () => {
    const service = createLocationService(
      dependencies({
        locate: vi.fn().mockRejectedValue({
          errCode: -1,
          errMsg: 'getLocation:fail:timeout',
        }),
      }),
    );
    await expect(service.locate()).rejects.toEqual(
      new LocationError('unavailable', '暂时无法获取定位，请稍后重试'),
    );
  });

  it('Taro 将 timeout 包装为 Error.message 时仍使用通用文案', async () => {
    const service = createLocationService(
      dependencies({
        locate: vi
          .fn()
          .mockRejectedValue(new Error('getLocation:fail:timeout')),
      }),
    );
    await expect(service.locate()).rejects.toMatchObject({
      kind: 'unavailable',
      message: '暂时无法获取定位，请稍后重试',
    });
  });

  it('恢复时只读取城市级缓存', () => {
    const deps = dependencies();
    deps.cache.restore.mockReturnValue(city);
    const service = createLocationService(deps);
    expect(service.restore()).toEqual(city);
  });

  it('服务端错误使用可读消息', async () => {
    const service = createLocationService(
      dependencies({
        resolve: vi.fn().mockResolvedValue({
          error: { message: '暂时无法识别所在城市，请稍后重试' },
        }),
      }),
    );
    await expect(service.locate()).rejects.toEqual(
      new LocationError('unavailable', '暂时无法识别所在城市，请稍后重试'),
    );
  });
});
