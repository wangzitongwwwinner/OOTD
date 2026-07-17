import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('设计令牌', () => {
  const tokens = readFileSync(
    resolve(process.cwd(), 'src/styles/tokens.scss'),
    'utf8',
  );

  it('使用确认的品牌色和页面尺寸节奏', () => {
    expect(tokens).toContain('--color-primary: #2d2926');
    expect(tokens).toContain('--color-canvas: #faf9f7');
    expect(tokens).toContain('--color-error: #ba1a1a');
    expect(tokens).toContain('--space-page: 24px');
    expect(tokens).toContain('--space-2: 8px');
    expect(tokens).toContain('--radius-card: 16px');
  });

  it('字体仅使用本地字体和系统回退', () => {
    expect(tokens).toMatch(
      /--font-serif: ['"]Noto Serif SC['"], ['"]Songti SC['"], SimSun, serif/,
    );
    expect(tokens).toMatch(
      /--font-sans: ['"]PingFang SC['"], ['"]Microsoft YaHei['"], sans-serif/,
    );
    expect(tokens).not.toMatch(/https?:\/\/|@font-face/);
  });
});
