import assert from 'node:assert/strict';
import test from 'node:test';

import { sceneListSchema, sceneSchema } from './scene.ts';

const preset = {
  id: 'preset_office',
  name: '办公室',
  category: 'office' as const,
  estimatedTemperatureCelsius: 22,
  feel: 'cold' as const,
  isPreset: true,
  createdAt: '2026-07-16T00:00:00.000Z',
  updatedAt: '2026-07-16T00:00:00.000Z',
  version: 1,
};

test('场景契约限定类别、体感和合理估计温度', () => {
  assert.deepEqual(sceneSchema.parse(preset), preset);
  assert.equal(
    sceneSchema.safeParse({ ...preset, feel: 'hot' }).success,
    false,
  );
  assert.equal(
    sceneSchema.safeParse({ ...preset, estimatedTemperatureCelsius: 80 })
      .success,
    false,
  );
});

test('公开场景列表不允许泄露 userId 或额外字段', () => {
  assert.deepEqual(sceneListSchema.parse({ items: [preset] }), {
    items: [preset],
  });
  assert.equal(
    sceneListSchema.safeParse({
      items: [{ ...preset, userId: 'internal-user' }],
    }).success,
    false,
  );
});
