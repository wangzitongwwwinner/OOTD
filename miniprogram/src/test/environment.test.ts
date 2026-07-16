import { expect, test } from 'vitest';

test('组件测试运行在 jsdom 环境', () => {
  expect(document).toBeDefined();
});
