import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('微信自定义一级导航配置', () => {
  it('由 custom-tab-bar 唯一接管原生 TabBar 槽位', () => {
    const config = readFileSync(
      resolve(process.cwd(), 'src/app.config.ts'),
      'utf8',
    );
    expect(config).toMatch(/tabBar:\s*{[\s\S]*?custom:\s*true/);
  });

  it('一级页面不再直接挂载第二套导航', () => {
    for (const page of ['index', 'scenes', 'wardrobe', 'try-on']) {
      const source = readFileSync(
        resolve(process.cwd(), `src/pages/${page}/index.tsx`),
        'utf8',
      );
      expect(source).not.toContain('<AppTabBar');
      expect(source).not.toMatch(/Taro\.(?:show|hide)TabBar/);
      expect(source).toContain('useSyncTabBar(');
    }
  });

  it('不依赖真机时序不稳定的当前路由推断选中项', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/custom-tab-bar/index.tsx'),
      'utf8',
    );
    expect(source).not.toContain('getCurrentInstance');
  });

  it('把本地图标复制到微信构建产物', () => {
    const config = readFileSync(
      resolve(process.cwd(), 'config/index.ts'),
      'utf8',
    );
    expect(config).toContain("from: 'src/assets/tabbar'");
    expect(config).toContain("to: 'dist/assets/tabbar'");
  });
});
