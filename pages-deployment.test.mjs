import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('GitHub Pages 使用仓库路径构建并部署 dist 目录', async () => {
  const [viteConfig, workflow] = await Promise.all([
    readFile('vite.config.ts', 'utf8'),
    readFile('.github/workflows/deploy-pages.yml', 'utf8'),
  ]);

  assert.match(viteConfig, /base:\s*process\.env\.GITHUB_ACTIONS\s*\?\s*'\/OOTD\/'/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /path:\s*'\.\/dist'/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
});
