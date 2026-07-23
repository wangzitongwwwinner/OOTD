import assert from 'node:assert/strict';
import test from 'node:test';

import { readMpsEnvironment } from './mps-config.ts';

test('从不使用云函数保留前缀的环境变量读取 MPS 配置', () => {
  const config = readMpsEnvironment({
    MPS_SECRET_ID: ' secret-id ',
    MPS_SECRET_KEY: ' secret-key ',
    MPS_OUTPUT_BUCKET: ' bucket ',
    MPS_OUTPUT_REGION: ' ap-shanghai ',
    MPS_OUTPUT_FILE_ID_PREFIX: ' cloud://env.bucket/ ',
    TENCENTCLOUD_SECRET_ID: 'reserved-id',
    TENCENTCLOUD_SECRET_KEY: 'reserved-key',
  });

  assert.deepEqual(config, {
    secretId: 'secret-id',
    secretKey: 'secret-key',
    outputBucket: 'bucket',
    outputRegion: 'ap-shanghai',
    outputFileIdPrefix: 'cloud://env.bucket/',
  });
});

test('缺少任一允许的 MPS 环境变量时不启用服务', () => {
  assert.equal(readMpsEnvironment({
    MPS_SECRET_ID: 'secret-id',
    MPS_OUTPUT_BUCKET: 'bucket',
    MPS_OUTPUT_REGION: 'ap-shanghai',
    MPS_OUTPUT_FILE_ID_PREFIX: 'cloud://env.bucket/',
  }), undefined);
});
