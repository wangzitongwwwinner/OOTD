import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('界面图标由本地 SVG 兼容层渲染，不依赖 Google 图标字体', async () => {
  const [app, iconFallback, html] = await Promise.all([
    readFile('src/App.tsx', 'utf8'),
    readFile('src/components/MaterialSymbolFallback.tsx', 'utf8'),
    readFile('index.html', 'utf8'),
  ]);

  assert.match(app, /MaterialSymbolFallback/);
  assert.match(iconFallback, /wb_sunny/);
  assert.doesNotMatch(html, /fonts\.googleapis\.com/);
});
test('登录页也挂载本地图标兜底', async () => {
  const app = await readFile('src/App.tsx', 'utf8');

  assert.match(
    app,
    /if \(!user\.isLoggedIn\) \{\s*return \(\s*<>\s*<MaterialSymbolFallback \/>[\s\S]*?<WeChatLogin/,
  );
});

test('用户中心也挂载本地图标兜底，不显示英文图标名称', async () => {
  const app = await readFile('src/App.tsx', 'utf8');

  assert.match(
    app,
    /if \(showProfile\) \{\s*return \(\s*<>\s*<MaterialSymbolFallback \/>[\s\S]*?<ProfileView/,
  );
});
