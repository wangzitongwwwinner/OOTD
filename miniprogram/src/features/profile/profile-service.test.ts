import { describe, expect, it, vi } from 'vitest';

import { createProfileService } from './profile-service';

const profile = {
  id: 'user_1',
  nickname: '微信用户',
  recentFeelPreference: 'comfortable' as const,
  createdAt: '2026-07-18T02:00:00.000Z',
  updatedAt: '2026-07-18T02:00:00.000Z',
  version: 1,
};

describe('profile service', () => {
  it('读取当前资料并校验响应', async () => {
    const call = vi
      .fn()
      .mockResolvedValue({ data: profile, requestId: 'req_get' });
    const service = createProfileService(call);
    await expect(service.get()).resolves.toEqual(profile);
    expect(call).toHaveBeenCalledWith({ method: 'GET', path: '/v1/profile' });
  });

  it('更新时只发送体感和期望版本', async () => {
    const updated = {
      ...profile,
      recentFeelPreference: 'cool' as const,
      version: 2,
    };
    const call = vi
      .fn()
      .mockResolvedValue({ data: updated, requestId: 'req_patch' });
    const service = createProfileService(call);
    await expect(service.updateFeel('cool', 1)).resolves.toEqual(updated);
    expect(call).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/v1/profile',
      body: { recentFeelPreference: 'cool', expectedVersion: 1 },
    });
  });

  it('透传服务端可读错误并拒绝异常响应', async () => {
    const failed = createProfileService(
      vi.fn().mockResolvedValue({
        error: { message: '资料已在其他位置更新，请刷新后重试' },
        requestId: 'req_conflict',
      }),
    );
    await expect(failed.get()).rejects.toThrow('资料已在其他位置更新');
    const malformed = createProfileService(
      vi.fn().mockResolvedValue({ data: {} }),
    );
    await expect(malformed.get()).rejects.toThrow('资料响应异常');
  });
});
