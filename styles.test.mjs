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

test('场景库使用竖向条形卡片，并将操作按钮置于右侧', async () => {
  const css = await readFile(new URL('./styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.scene-list\{display:grid;gap:10px/);
  assert.match(css, /\.scene-card\{[^}]*grid-template-columns:auto 1fr auto/);
  assert.match(css, /\.scene-card-actions\{display:flex/);
});

test('衣橱筛选使用胶囊控件，衣物卡片只保留图片与管理按钮', async () => {
  const css = await readFile(new URL('./styles.css', import.meta.url), 'utf8');
  const app = await readFile(new URL('./app.mjs', import.meta.url), 'utf8');
  assert.match(css, /\.wardrobe-controls\{display:grid;grid-template-columns:1fr 1fr/);
  assert.match(css, /\.wardrobe-search\{[^}]*border-radius:999px/);
  assert.match(css, /\.wardrobe-controls label\{[^}]*border-radius:999px/);
  assert.match(css, /\.wardrobe-grid \.wardrobe-card\{[^}]*border:0[^}]*background:transparent/);
  assert.doesNotMatch(app, /class="wardrobe-card-info"/);
  assert.match(css, /\.wardrobe-grid \.wardrobe-photo\{[^}]*height:auto[^}]*aspect-ratio:1/);
  assert.match(css, /\.wardrobe-grid \.wardrobe-actions\{[^}]*display:flex[^}]*height:auto/);
  assert.match(css, /\.wardrobe-actions button\{[^}]*background:rgba\(45,48,53,.72\)/);
});
