import assert from 'node:assert/strict';
import test from 'node:test';

import {
  apiEnvelopeSchema,
  failure,
  success,
} from './envelope.ts';

test('成功响应只包含 data 和 requestId', () => {
  const response = success({ city: '上海' }, 'req_success');

  assert.deepEqual(response, {
    data: { city: '上海' },
    requestId: 'req_success',
  });
  assert.equal(apiEnvelopeSchema.safeParse(response).success, true);
});

test('失败响应包含稳定错误码、用户消息和 retryable', () => {
  const response = failure(
    'VALIDATION_ERROR',
    '请求参数不完整',
    false,
    'req_failure',
  );

  assert.deepEqual(response, {
    error: {
      code: 'VALIDATION_ERROR',
      message: '请求参数不完整',
      retryable: false,
    },
    requestId: 'req_failure',
  });
  assert.equal(apiEnvelopeSchema.safeParse(response).success, true);
});

test('响应信封拒绝未知错误码和额外字段', () => {
  assert.equal(
    apiEnvelopeSchema.safeParse({
      error: {
        code: 'UNKNOWN_CODE',
        message: '内部细节',
        retryable: false,
      },
      requestId: 'req_invalid',
    }).success,
    false,
  );

  assert.equal(
    apiEnvelopeSchema.safeParse({
      data: {},
      requestId: 'req_extra',
      userId: 'client-forged-user',
    }).success,
    false,
  );
});
