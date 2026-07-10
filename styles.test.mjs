import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('首页行程与底部导航使用确认后的可读性尺寸', async () => {
  const css = await readFile(new URL('./styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.timeline-item\{[^}]*min-height:44px[^}]*font-size:13px/);
  assert.match(css, /\.timeline-item>strong\{font-size:13px/);
  assert.match(css, /\.trip-parts span\{[^}]*font-size:13px/);
  assert.match(css, /\.tabbar\{[^}]*height:78px/);
  assert.match(css, /\.tabbar button\{[^}]*font-size:10px/);
  assert.match(css, /\.tabbar svg\{width:27px;height:27px/);
});

test('底部卡片在移动端原型中水平居中', async () => {
  const css = await readFile(new URL('./styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.bottom-sheet\{[^}]*left:50%[^}]*transform:translateX\(-50%\)/);
});

test('AI 建议入口使用醒目的胶囊按钮样式', async () => {
  const css = await readFile(new URL('./styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.advice-generate\{[^}]*border-radius:999px[^}]*font-size:14px/);
});
