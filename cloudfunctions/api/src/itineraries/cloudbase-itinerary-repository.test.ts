import assert from 'node:assert/strict';
import test from 'node:test';
import type { Db } from '@cloudbase/database';

import { CloudBaseItineraryRepository } from './cloudbase-itinerary-repository.ts';

function createDatabase() {
  const userId = 'user_12dbdfa8-d30f-498c-ad14-3e6d37c8d08e';
  const data: Record<string, Array<Record<string, unknown>>> = {
    users: [{ _id: 'db_user_1', id: userId, wechatOpenId: 'openid', wechatAppId: 'appid' }],
    itineraries: [{
      _id: 'preset_itinerary_metro__user_12dbdfa8-d30f-498c-ad14-3e6d37c8d08e', id: 'preset_itinerary_metro__user_12dbdfa8-d30f-498c-ad14-3e6d37c8d08e',
      sourcePresetId: 'preset_itinerary_metro', userId, localDate: '2026-08-01',
      startTime: '07:30', sceneId: 'preset_metro__user_12dbdfa8-d30f-498c-ad14-3e6d37c8d08e', sceneName: 'Modified commute',
      sceneCategory: 'metro', estimatedTemperatureCelsius: 26, durationMinutes: 45,
      version: 2, createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:30:00.000Z',
    }],
  };
  const collection = (name: string) => ({
    where(query: Record<string, unknown>) {
      const matches = () => data[name]!.filter((item) => Object.entries(query).every(([key, value]) => item[key] === value));
      return {
        limit() { return { get: async () => ({ data: matches() }) }; },
        orderBy() { return { limit() { return { get: async () => ({ data: matches().sort((a, b) => String(a.startTime).localeCompare(String(b.startTime))) }) }; } }; },
        async update(patch: Record<string, unknown>) { for (const item of matches()) Object.assign(item, patch); },
        async remove() { const removing = new Set(matches()); data[name] = data[name]!.filter((item) => !removing.has(item)); },
      };
    },
    doc(id: string) { return {
      async set(value: Record<string, unknown>) { const existing = data[name]!.find((item) => item._id === id); if (existing) Object.assign(existing, value); else data[name]!.push({ ...value, _id: id }); },
      async update(patch: Record<string, unknown>) { const existing = data[name]!.find((item) => item._id === id); if (existing) Object.assign(existing, patch); },
    }; },
    async add(value: Record<string, unknown>) { data[name]!.push({ ...value, _id: String(value.id) }); },
  });
  return { database: { collection } as unknown as Db, data };
}

test('itinerary initialization retries only fill missing examples and never overwrite an existing copy', async () => {
  const { database, data } = createDatabase();
  const repository = new CloudBaseItineraryRepository(database);
  const identity = { openId: 'openid', appId: 'appid' };
  const first = await repository.findByDate('2026-08-01', identity);
  assert.equal(first.length, 2);
  const modified = first.find((item) => item.id === 'preset_itinerary_metro');
  assert.equal(modified?.startTime, '07:30');
  assert.equal(modified?.durationMinutes, 45);
  assert.ok(first.every((item) => item.id.length <= 64));
  assert.deepEqual(first.map((item) => item.id).sort(), ['preset_itinerary_metro', 'preset_itinerary_office']);
  assert.equal(data.users![0]!.itineraryExamplesInitializedVersion, 1);

  data.itineraries = data.itineraries!.filter((item) => item.sourcePresetId !== 'preset_itinerary_office');
  const second = await repository.findByDate('2026-08-01', identity);
  assert.equal(second.length, 1);

  const created = await repository.create({
    startTime: '18:00',
    sceneId: 'preset_office__' + String(data.users![0]!.id),
    sceneName: 'Office',
    sceneCategory: 'office',
    estimatedTemperatureCelsius: 22,
    durationMinutes: 60,
  }, identity);
  assert.match(created.id, /^iti_/);
  assert.equal(created.sceneName, 'Office');
});
