import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

test('M0-05 固定夹具使用上海时区、虚构身份和可识别测试标记', async () => {
  const manifest = await readJson('tests/fixtures/manifest.json');

  assert.equal(manifest.fixtureSetId, 'm0-05-baseline');
  assert.equal(manifest.timezone, 'Asia/Shanghai');
  assert.equal(manifest.fixedNow, '2026-01-15T08:00:00+08:00');
  assert.equal(manifest.testDataMarker, '__test__');
  assert.match(manifest.fictionalUser.openId, /^__test__/);
  assert.equal(manifest.fictionalUser.isFictional, true);
  assert.equal(manifest.location.precision, 'city');
  assert.equal(manifest.location.isFictional, true);
});

test('M0-05 天气夹具覆盖五类确定场景且不包含精确定位', async () => {
  const cases = await readJson('tests/fixtures/weather-cases.json');

  assert.deepEqual(
    cases.map((item) => item.kind),
    ['extreme-cold', 'cool', 'comfortable', 'hot', 'large-day-night-gap'],
  );
  for (const item of cases) {
    assert.equal(item.city, '测试市');
    assert.equal('latitude' in item, false);
    assert.equal('longitude' in item, false);
    assert.equal(typeof item.temperatureC, 'number');
  }
});

test('M0-05 外部服务夹具覆盖成功、超时、限流和无效响应', async () => {
  const cases = await readJson('tests/fixtures/external-service-cases.json');

  assert.deepEqual(
    cases.map((item) => item.outcome),
    ['success', 'timeout', 'rate-limited', 'invalid-response'],
  );
  assert.ok(cases.every((item) => item.isStub === true));
});

test('M0-05 三个构建阶段只映射到唯一 CloudBase 环境', async () => {
  const environments = await readJson('config/environments.json');

  assert.equal(environments.schemaVersion, 1);
  assert.equal(
    environments.cloudbase.environmentId,
    'ootd-ai-dev-d6g5hzex6925fcea7',
  );
  assert.equal(environments.cloudbase.region, 'ap-shanghai');
  assert.deepEqual(Object.keys(environments.stages), ['development', 'test', 'production']);
  for (const stage of Object.values(environments.stages)) {
    assert.equal(
      stage.cloudbaseEnvironmentId,
      'ootd-ai-dev-d6g5hzex6925fcea7',
    );
  }
  assert.equal(environments.testData.marker, '__test__');
  assert.equal(environments.testData.cleanupRequiresMarker, true);
});

test('M0-05 环境变量示例不包含真实密钥', async () => {
  const example = await readFile('.env.example', 'utf8');

  assert.match(
    example,
    /^CLOUDBASE_ENV_ID=ootd-ai-dev-d6g5hzex6925fcea7$/m,
  );
  assert.match(example, /^CLOUDBASE_REGION=ap-shanghai$/m);
  assert.match(example, /^TEST_DATA_MARKER=__test__$/m);
  for (const name of ['QWEATHER_API_KEY', 'HUNYUAN_API_KEY', 'MPS_SECRET_ID', 'MPS_SECRET_KEY']) {
    assert.match(example, new RegExp(`^${name}=$`, 'm'));
  }
  for (const line of example.split(/\r?\n/)) {
    if (!/^(?:[^#=]*(?:API_KEY|SECRET|APPSECRET)[^=]*)=/i.test(line)) continue;
    assert.equal(line.slice(line.indexOf('=') + 1), '');
  }
});

test('M0-05 根质量命令覆盖测试、类型、格式和三类构建', async () => {
  const packageJson = await readJson('package.json');

  assert.equal(
    packageJson.scripts['quality:tests'],
    'npm run test:baseline && npm run test:weapp && npm run test:contracts && npm run test:cloudfunctions',
  );
  assert.equal(
    packageJson.scripts['quality:types'],
    'npm run lint && npm run typecheck:weapp && npm run typecheck:contracts && npm run typecheck:cloudfunctions',
  );
  assert.equal(
    packageJson.scripts['quality:builds'],
    'npm run build && npm run build:weapp && npm run build:cloudfunctions',
  );
  assert.equal(
    packageJson.scripts.quality,
    'npm run quality:tests && npm run quality:types && npm run format:weapp && npm run quality:builds',
  );
});

test('M0-05 GitHub Actions 使用锁文件且不接触云端和密钥', async () => {
  const workflow = await readFile('.github/workflows/quality.yml', 'utf8');

  assert.match(workflow, /node-version: ['"]20\.19\.2['"]/);
  assert.match(workflow, /permissions:\s*\n\s*contents: read/);
  assert.equal((workflow.match(/run: npm ci(?:\s|$)/g) ?? []).length, 4);
  assert.match(workflow, /run: npm run quality/);
  assert.doesNotMatch(workflow, /secrets\.|cloudbase\s+functions:deploy|cloudbase\s+framework:deploy|upload|deploy/i);
});

test('M0-05 验收后开发顺序推进到 M1-01', async () => {
  const task = await readFile('TASK.md', 'utf8');

  assert.match(
    task,
    /\| M0-05 \| 建立测试夹具、CI 门禁和环境配置 \| M0-02,M0-03 \|[^|]+\| 已完成 \|/,
  );
  assert.match(
    task,
    /\| M1-01 \| 微信登录与会话恢复 \| M0 \|[^|]+\| (?:进行中|待验收|已完成) \|/,
  );
});
