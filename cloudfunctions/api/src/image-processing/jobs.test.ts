import assert from "node:assert/strict";
import test from "node:test";

import type { CutoutJob } from "../../../../packages/contracts/src/index.ts";
import type { TrustedIdentity } from "../context.ts";
import { getCutoutJob, retryCutoutJob, startCutoutJob } from "./jobs.ts";
import type { CutoutProvider } from "./provider.ts";
import type { CutoutJobRepository, InternalCutoutJob } from "./repository.ts";

const identity: TrustedIdentity = {
  openId: "trusted-open-id",
  appId: "trusted-app-id",
};
const base: CutoutJob = {
  id: "cutout_1",
  clothingId: "clothing_1",
  status: "processing",
  attempts: 1,
  createdAt: "2026-07-22T08:00:00.000Z",
  updatedAt: "2026-07-22T08:00:00.000Z",
  version: 1,
};

function repository(
  overrides: Partial<CutoutJobRepository> = {},
): CutoutJobRepository {
  return {
    begin: async (_input, received) => {
      assert.deepEqual(received, identity);
      return {
        status: "created",
        job: { ...base, sourceFileId: "cloud://source.jpg" },
      };
    },
    attachProviderTask: async (job, providerTaskId) => ({
      ...job,
      providerTaskId,
    }),
    findById: async () => undefined,
    succeed: async (_job, processedFileId) => ({
      ...base,
      status: "succeeded",
      processedFileId,
      version: 2,
    }),
    fail: async () => ({
      ...base,
      status: "failed",
      message: "智能抠图失败，请重试",
      version: 2,
    }),
    retry: async () => ({
      status: "retried",
      job: {
        ...base,
        status: "processing",
        attempts: 2,
        version: 3,
        sourceFileId: "cloud://source.jpg",
      },
    }),
    ...overrides,
  };
}

test("使用可信身份创建任务并提交供应商", async () => {
  const provider: CutoutProvider = {
    submit: async (input) => {
      assert.equal(input.sourceFileId, "cloud://source.jpg");
      assert.equal(
        input.outputPath,
        "clothing-processed/clothing_1/cutout_1.png",
      );
      return { taskId: "mps_task_1" };
    },
    inspect: async () => ({ status: "processing" }),
  };
  const result = await startCutoutJob(
    { clothingId: "clothing_1", expectedVersion: 2 },
    identity,
    { repository: repository(), provider },
    "req_start",
  );
  assert.deepEqual(result, { data: base, requestId: "req_start" });
});

test("查询处理中任务并在供应商成功时完成衣物", async () => {
  const stored: InternalCutoutJob = {
    ...base,
    sourceFileId: "cloud://source.jpg",
    providerTaskId: "mps_task_1",
  };
  const result = await getCutoutJob(
    "cutout_1",
    identity,
    {
      repository: repository({
        findById: async (_id, received) => {
          assert.deepEqual(received, identity);
          return stored;
        },
      }),
      provider: {
        submit: async () => ({ taskId: "unused" }),
        inspect: async () => ({
          status: "succeeded",
          processedFileId: "cloud://processed.png",
        }),
      },
    },
    "req_get",
  );
  assert.equal("data" in result && result.data.status, "succeeded");
  assert.equal(
    "data" in result && result.data.processedFileId,
    "cloud://processed.png",
  );
});

test("其他用户任务返回 NOT_FOUND 且不访问供应商", async () => {
  let inspected = false;
  const result = await getCutoutJob(
    "cutout_1",
    identity,
    {
      repository: repository({ findById: async () => undefined }),
      provider: {
        submit: async () => ({ taskId: "unused" }),
        inspect: async () => {
          inspected = true;
          return { status: "processing" };
        },
      },
    },
    "req_missing",
  );
  assert.equal(inspected, false);
  assert.deepEqual(result, {
    error: { code: "NOT_FOUND", message: "抠图任务不存在", retryable: false },
    requestId: "req_missing",
  });
});

test("失败任务仅允许第二次提交，超过次数返回冲突", async () => {
  const provider: CutoutProvider = {
    submit: async () => ({ taskId: "mps_task_2" }),
    inspect: async () => ({ status: "processing" }),
  };
  const retried = await retryCutoutJob(
    "cutout_1",
    { expectedVersion: 2 },
    identity,
    {
      repository: repository(),
      provider,
    },
    "req_retry",
  );
  assert.equal("data" in retried && retried.data.attempts, 2);

  const rejected = await retryCutoutJob(
    "cutout_1",
    { expectedVersion: 3 },
    identity,
    {
      repository: repository({ retry: async () => ({ status: "exhausted" }) }),
      provider,
    },
    "req_exhausted",
  );
  assert.deepEqual(rejected, {
    error: {
      code: "CONFLICT",
      message: "已达到最大重试次数，请重新上传图片",
      retryable: false,
    },
    requestId: "req_exhausted",
  });
});

test("供应商提交失败时将已创建任务标记为失败", async () => {
  let failed = false;
  const result = await startCutoutJob(
    { clothingId: "clothing_1", expectedVersion: 2 },
    identity,
    {
      repository: repository({
        fail: async (job) => {
          failed = true;
          return {
            ...job,
            status: "failed",
            message: "智能抠图失败，请重试",
            version: job.version + 1,
          };
        },
      }),
      provider: {
        submit: async () => {
          throw new Error("provider unavailable");
        },
        inspect: async () => ({ status: "processing" }),
      },
    },
    "req_submit_failed",
  );

  assert.equal(failed, true);
  assert.equal(
    "error" in result && result.error.code,
    "EXTERNAL_SERVICE_ERROR",
  );
});
