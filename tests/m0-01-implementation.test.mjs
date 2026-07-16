import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('M0-01 使用统一的 Taro 4.2.0 依赖基线', async () => {
  const packageJson = JSON.parse(
    await readFile('miniprogram/package.json', 'utf8'),
  );
  const taroPackages = [
    '@tarojs/components',
    '@tarojs/react',
    '@tarojs/runtime',
    '@tarojs/taro',
  ];
  const taroDevPackages = [
    '@tarojs/cli',
    '@tarojs/plugin-framework-react',
    '@tarojs/plugin-platform-weapp',
    '@tarojs/webpack5-runner',
    'babel-preset-taro',
  ];

  for (const packageName of taroPackages) {
    assert.equal(packageJson.dependencies[packageName], '4.2.0');
  }
  for (const packageName of taroDevPackages) {
    assert.equal(packageJson.devDependencies[packageName], '4.2.0');
  }
  assert.equal(
    packageJson.devDependencies['@babel/preset-react'],
    '7.29.7',
  );
});

test('登录原型只保留微信一键登录，不包含手机号登录入口或短信状态', async () => {
  const login = await readFile('src/components/WeChatLogin.tsx', 'utf8');

  assert.match(login, /微信一键登录/);
  assert.doesNotMatch(login, /手机号|手机号码|短信|phone_|sms/i);
});
