import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

test('M0-03 声明完整集合并固定到唯一 CloudBase 环境', async () => {
  const schema = await readJson('cloudbase/database/collections.json');
  const names = schema.collections.map((collection) => collection.name);

  assert.equal(schema.environment, 'ootd-ai-dev-d6g5hzex6925fcea7');
  assert.deepEqual(names, [
    'users',
    'scenes',
    'itineraries',
    'clothing',
    'outfits',
    'imageProcessingJobs',
    'recommendationSnapshots',
    'weatherCache',
    'idempotencyKeys',
  ]);

  for (const collection of schema.collections) {
    assert.ok(collection.requiredFields.includes('id'));
    assert.ok(collection.requiredFields.includes('createdAt'));
    assert.ok(collection.requiredFields.includes('updatedAt'));
  }
});

test('M0-03 为身份、当天行程、建议缓存和幂等写入声明关键索引', async () => {
  const schema = await readJson('cloudbase/database/indexes.json');
  const indexes = new Map(
    schema.indexes.map((index) => [`${index.collection}:${index.name}`, index]),
  );

  assert.equal(indexes.get('users:wechat_open_id_unique').unique, true);
  assert.deepEqual(
    indexes.get('itineraries:user_date_start').fields,
    ['userId', 'localDate', 'startTime'],
  );
  assert.deepEqual(
    indexes.get('recommendationSnapshots:user_date_hash').fields,
    ['userId', 'localDate', 'inputHash'],
  );
  assert.equal(indexes.get('idempotencyKeys:user_scope_key').unique, true);
});

test('M0-03 云函数权限默认只允许已登录且非匿名用户调用', async () => {
  const rules = await readJson('cloudbase/security/functions.json');

  assert.deepEqual(rules['*'], {
    invoke: "auth.loginType != 'ANONYMOUS' && auth != null",
  });
});

test('M0-03 完成后开发顺序推进到 M0-04', async () => {
  const task = await readFile('TASK.md', 'utf8');

  assert.match(
    task,
    /\| M0-03 \| 建立云函数、数据库与共享契约骨架 \| M0-01 \|[^|]+\| 已完成 \|/,
  );
  assert.match(
    task,
    /\| M0-04 \| 迁移设计令牌、字体和基础组件 \| M0-02 \|[^|]+\| (?:进行中|待验收|已完成) \|/,
  );
});
