import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const productNameFiles = [
  'AGENTS.md',
  'ARCHITECTURE.md',
  'DESIGN.md',
  'DEVELOPMENT.md',
  'FEISHU_DOCS.md',
  'PRODUCT.md',
  'PROGRESS.md',
  'README.md',
  'TASK.md',
  'TEST.md',
  'WECHAT_MINIPROGRAM.md',
  'index.html',
  'src/components/HomeView.tsx',
  'src/components/ProfileView.tsx',
  'src/components/WeChatLogin.tsx',
];

test('项目文档和产品原型统一使用“穿衣有数”', async () => {
  const contents = await Promise.all(
    productNameFiles.map(async (path) => ({
      path,
      content: await readFile(path, 'utf8'),
    })),
  );

  for (const { path, content } of contents) {
    assert.doesNotMatch(content, /今天穿什么/, `${path} 仍包含旧产品名`);
  }

  assert.match(
    contents.find(({ path }) => path === 'PRODUCT.md').content,
    /### 1\.1 产品名称\s+穿衣有数/,
  );
  assert.match(
    contents.find(({ path }) => path === 'index.html').content,
    /<title>穿衣有数｜交互原型<\/title>/,
  );
});
