import assert from 'node:assert/strict';
import test from 'node:test';
import { getTodayItineraries } from './today.ts';
import type { ItineraryRepository } from './repository.ts';
import type { Itinerary } from '../../../../packages/contracts/src/index.ts';

const item: Itinerary = {
  id: 'iti_001', startTime: '09:00', sceneId: 'scene_office',
  sceneName: '办公室', sceneCategory: 'office',
  estimatedTemperatureCelsius: 22, durationMinutes: 480,
  createdAt: '2026-07-20T00:00:00.000Z', updatedAt: '2026-07-20T00:00:00.000Z', version: 1,
};

test('查询当天行程返回成功信封', async () => {
  let receivedDate: unknown; let receivedIdentity: unknown;
  const repo: ItineraryRepository = { findByDate: async (d, id) => { receivedDate = d; receivedIdentity = id; return [item]; } };
  const now = new Date('2026-07-20T10:00:00.000Z');
  const res = await getTodayItineraries({ openId: 'o', appId: 'a' }, repo, 'req1', () => now);
  assert.equal(receivedDate, '2026-07-20');
  assert.deepEqual(res, { data: { items: [item] }, requestId: 'req1' });
});

test('空行程返回空列表', async () => {
  const repo: ItineraryRepository = { findByDate: async () => [] };
  const now = new Date('2026-07-20T10:00:00.000Z');
  const res = await getTodayItineraries({ openId: 'o', appId: 'a' }, repo, 'req2', () => now);
  assert.deepEqual(res, { data: { items: [] }, requestId: 'req2' });
});

test('仓储失败返回可重试错误', async () => {
  const repo: ItineraryRepository = { findByDate: async () => { throw new Error('db'); } };
  const now = new Date('2026-07-20T10:00:00.000Z');
  const res = await getTodayItineraries({ openId: 'o', appId: 'a' }, repo, 'req3', () => now);
  assert.deepEqual(res, { error: { code: 'INTERNAL_ERROR', message: '行程加载失败，请稍后重试', retryable: true }, requestId: 'req3' });
});
