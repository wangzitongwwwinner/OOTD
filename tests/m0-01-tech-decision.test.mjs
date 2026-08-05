import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('M0-01 固化 Taro 4 与外部服务决策并移除手机号登录范围', async () => {
  const architecture = await readFile('ARCHITECTURE.md', 'utf8');
  const product = await readFile('PRODUCT.md', 'utf8');
  const task = await readFile('TASK.md', 'utf8');

  assert.match(architecture, /Taro 4\.2\.0/);
  assert.match(architecture, /Nodejs20\.19/);
  assert.match(architecture, /和风天气/);
  assert.match(architecture, /腾讯混元/);
  assert.match(architecture, /腾讯云媒体处理 MPS/);
  assert.doesNotMatch(architecture, /手机号|短信|phoneHash|SMS/);
  assert.doesNotMatch(product, /手机号|短信/);
  assert.doesNotMatch(task, /M1-02|手机号|短信/);
  assert.match(
    task,
    /\| M0-01 \| 确认生产技术选型与供应商决策门 \| M0-00 \|[^|]+\| 已完成 \|/,
  );
});
