import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('M0-02 小程序包提供独立的质量检查命令与配置', async () => {
  const packageJson = JSON.parse(
    await readFile('miniprogram/package.json', 'utf8'),
  );
  const rootPackageJson = JSON.parse(await readFile('package.json', 'utf8'));
  const task = await readFile('TASK.md', 'utf8');

  assert.equal(packageJson.scripts.typecheck, 'tsc --noEmit');
  assert.equal(packageJson.scripts.lint, 'eslint .');
  assert.equal(packageJson.scripts.test, 'vitest run');
  assert.equal(packageJson.scripts.format, 'prettier --check .');

  assert.equal(rootPackageJson.scripts['typecheck:weapp'], 'npm --prefix miniprogram run typecheck');
  assert.equal(rootPackageJson.scripts['lint:weapp'], 'npm --prefix miniprogram run lint');
  assert.equal(rootPackageJson.scripts['test:weapp'], 'npm --prefix miniprogram run test');

  await readFile('miniprogram/eslint.config.mjs', 'utf8');
  await readFile('miniprogram/prettier.config.mjs', 'utf8');
  await readFile('miniprogram/vitest.config.ts', 'utf8');
  await readFile('miniprogram/src/test/setup.ts', 'utf8');
  assert.match(
    task,
    /\| M0-02 \| 建立 Taro 小程序骨架与质量工具 \| M0-01 \|[^|]+\| 已完成 \|/,
  );
});
