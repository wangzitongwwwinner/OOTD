import assert from 'node:assert/strict';
import test from 'node:test';

import { listScenes } from './list-scenes.ts';
import type { SceneRepository } from './scene-repository.ts';

test('返回稳定预设和当前可信身份的自定义场景', async () => {
  let receivedIdentity: unknown;
  const repository: SceneRepository = {
    findCustomByIdentity: async (identity) => {
      receivedIdentity = identity;
      return [
        {
          id: 'scene_gym',
          name: '健身房',
          category: 'custom',
          estimatedTemperatureCelsius: 24,
          feel: 'stuffy',
          isPreset: false,
          note: '运动时偏热',
          createdAt: '2026-07-20T01:00:00.000Z',
          updatedAt: '2026-07-20T01:00:00.000Z',
          version: 1,
        },
      ];
    },
  };

  const response = await listScenes(
    { openId: 'trusted-open-id', appId: 'trusted-app-id' },
    repository,
    'req_scenes',
  );

  assert.deepEqual(receivedIdentity, {
    openId: 'trusted-open-id',
    appId: 'trusted-app-id',
  });
  assert.equal('data' in response && response.data.items.length, 5);
  assert.deepEqual(
    'data' in response
      ? response.data.items.slice(0, 4).map((scene) => scene.id)
      : [],
    ['preset_office', 'preset_home', 'preset_metro', 'preset_mall'],
  );
  assert.equal(
    'data' in response &&
      response.data.items.every((scene) => !('userId' in scene)),
    true,
  );
});

test('仓储失败返回友好可重试错误', async () => {
  const repository: SceneRepository = {
    findCustomByIdentity: async () => {
      throw new Error('database secret');
    },
  };
  assert.deepEqual(
    await listScenes(
      { openId: 'trusted-open-id', appId: 'trusted-app-id' },
      repository,
      'req_scenes_error',
    ),
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: '场景加载失败，请稍后重试',
        retryable: true,
      },
      requestId: 'req_scenes_error',
    },
  );
});
