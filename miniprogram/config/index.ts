import { defineConfig } from '@tarojs/cli';

export default defineConfig({
  projectName: '穿衣有数',
  date: '2026-07-16',
  designWidth: 375,
  deviceRatio: {
    375: 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  framework: 'react',
  compiler: 'webpack5',
  cache: {
    enable: false,
  },
  copy: {
    patterns: [
      {
        from: 'src/sitemap.json',
        to: 'dist/sitemap.json',
      },
      {
        from: 'src/assets/tabbar',
        to: 'dist/assets/tabbar',
      },
      {
        from: 'src/assets/icons',
        to: 'dist/assets/icons',
      },
    ],
    options: {},
  },
  mini: {},
});
