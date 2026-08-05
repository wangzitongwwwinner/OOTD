import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('云函数完整测试门禁包含指标计算与报告回归', async () => {
  const packageJson = JSON.parse(
    await readFile('cloudfunctions/api/package.json', 'utf8'),
  );
  const command = packageJson.scripts.test;

  assert.match(command, /src\/metrics\/calculate-metrics\.test\.ts/);
  assert.match(command, /src\/metrics\/render-metric-report\.test\.ts/);
});
