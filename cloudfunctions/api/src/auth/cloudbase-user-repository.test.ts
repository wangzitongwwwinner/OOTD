import assert from 'node:assert/strict';
import test from 'node:test';
import type { Db } from '@cloudbase/database';

import { CloudBaseUserRepository } from './cloudbase-user-repository.ts';

function createDatabase() {
  const users: Array<Record<string, unknown>> = [{
    _id: 'db_existing', id: 'user_existing', wechatOpenId: 'same-openid',
    wechatAppId: 'app-a', nickname: 'Existing', recentFeelPreference: 'comfortable',
    createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z', version: 1,
  }];
  const collection = () => ({
    where(query: Record<string, unknown>) {
      const matches = () => users.filter((item) => Object.entries(query).every(([key, value]) => item[key] === value));
      return {
        limit() { return { get: async () => ({ data: matches() }) }; },
        async update(patch: Record<string, unknown>) { for (const item of matches()) Object.assign(item, patch); return { updated: matches().length }; },
      };
    },
    doc(id: string) { return { async update(patch: Record<string, unknown>) { const item = users.find((user) => user._id === id || user.id === id); if (item) Object.assign(item, patch); } }; },
    async add(value: Record<string, unknown>) { users.push({ ...value, _id: String(value.id) }); },
  });
  return { database: { collection } as unknown as Db, users };
}

test('wechat identity isolation includes appId when finding or creating users', async () => {
  const { database, users } = createDatabase();
  const repository = new CloudBaseUserRepository(database);
  const created = await repository.findOrCreateByWechatIdentity({
    openId: 'same-openid', appId: 'app-b',
    agreement: { userAgreementVersion: '1', privacyPolicyVersion: '1', acceptedAt: '2026-08-01T01:00:00.000Z' },
    now: '2026-08-01T01:00:00.000Z',
  });
  assert.notEqual(created.id, 'user_existing');
  assert.equal(users.length, 2);
  assert.equal(users[0]!.version, 1);
  assert.equal(users[1]!.wechatAppId, 'app-b');
});
