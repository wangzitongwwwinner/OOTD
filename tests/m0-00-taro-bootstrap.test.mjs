import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readUtf8 = (path) => readFile(path, 'utf8');

test('M0-00 提供可导入微信开发者工具的 Taro 构建配置', async () => {
  const packageJson = JSON.parse(await readUtf8('package.json'));
  const taroConfig = await readUtf8('miniprogram/config/index.ts');
  const appConfig = await readUtf8('miniprogram/src/app.config.ts');
  const projectConfig = JSON.parse(
    await readUtf8('project.config.json'),
  );
  const cloudFunctionPackage = JSON.parse(
    await readUtf8('cloudfunctions/api/package.json'),
  );
  const gitignore = await readUtf8('.gitignore');

  assert.equal(
    packageJson.scripts['build:weapp'],
    'npm --prefix miniprogram run build:weapp',
  );
  assert.match(taroConfig, /outputRoot:\s*['"]dist['"]/);
  assert.match(taroConfig, /from:\s*['"]src\/sitemap\.json['"]/);
  assert.match(taroConfig, /to:\s*['"]dist\/sitemap\.json['"]/);
  assert.match(
    appConfig,
    /lazyCodeLoading:\s*['"]requiredComponents['"]/,
    '应启用微信小程序组件按需注入',
  );
  assert.match(appConfig, /pages\/index\/index/);
  assert.equal(projectConfig.appid, 'wxf9475a79c2296561');
  assert.equal(projectConfig.miniprogramRoot, 'miniprogram/dist/');
  assert.equal(projectConfig.cloudfunctionRoot, 'cloudfunctions/');
  assert.equal(cloudFunctionPackage.main, 'index.js');
  assert.equal(cloudFunctionPackage.type, 'commonjs');
  assert.match(cloudFunctionPackage.scripts.build, /--outfile=index\.js/);
  assert.match(gitignore, /miniprogram\/project\.private\.config\.json/);
});
