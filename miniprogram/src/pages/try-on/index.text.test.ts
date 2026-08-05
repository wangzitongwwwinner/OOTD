import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('\u8bd5\u8863\u753b\u677f\u7a7a\u72b6\u6001\u4f7f\u7528\u6b63\u786e\u4e2d\u6587\u6587\u6848', () => {
  const source = readFileSync('src/pages/try-on/index.tsx', 'utf8');
  expect(source).toContain('<Text>\u8bd5\u8863\u642d\u914d\u753b\u677f</Text>');
  expect(source).toContain(
    '<Text>\u4ece\u5e95\u680f\u9009\u53d6\u8863\u7269\uff0c\u81ea\u7531\u62d6\u62fd\u6216\u8c03\u6574\u5c42\u53e0</Text>',
  );
  expect(source).not.toContain('<Text>??????</Text>');
});
