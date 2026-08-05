import assert from 'node:assert/strict';
import test from 'node:test';

import { itineraryListSchema, itinerarySchema } from './itinerary.ts';

const sample = {
  id: 'iti_001',
  startTime: '09:00',
  sceneId: 'scene_office',
  sceneName: '办公室',
  sceneCategory: 'office' as const,
  estimatedTemperatureCelsius: 22,
  durationMinutes: 480,
  createdAt: '2026-07-20T00:00:00.000Z',
  updatedAt: '2026-07-20T00:00:00.000Z',
  version: 1,
};

test('行程契约限定字段和范围', () => {
  assert.deepEqual(itinerarySchema.parse(sample), sample);
  assert.equal(
    itinerarySchema.safeParse({ ...sample, durationMinutes: 0 }).success,
    false,
  );
  assert.equal(
    itinerarySchema.safeParse({ ...sample, sceneId: '' }).success,
    false,
  );
});

test('行程列表不允许泄露 userId 或额外字段', () => {
  assert.deepEqual(itineraryListSchema.parse({ items: [sample] }), { items: [sample] });
  assert.equal(
    itineraryListSchema.safeParse({ items: [{ ...sample, userId: 'x' }] }).success,
    false,
  );
});
