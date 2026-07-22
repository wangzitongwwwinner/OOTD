import assert from "node:assert/strict";
import test from "node:test";

import type {
  CreateClothingUploadRequest,
  CreateClothingUploadResult,
} from "../../../../packages/contracts/src/index.ts";
import type { TrustedIdentity } from "../context.ts";
import { createClothingUpload } from "./create-upload.ts";
import type { ClothingRepository } from "./repository.ts";

const identity: TrustedIdentity = {
  openId: "trusted-open-id",
  appId: "trusted-app-id",
};
const input: CreateClothingUploadRequest = {
  name: "白色棉质 T 恤",
  category: "top",
  color: "白色",
  extension: "jpg",
  mimeType: "image/jpeg",
  sizeBytes: 2048,
};

function repository(
  overrides: Partial<ClothingRepository> = {},
): ClothingRepository {
  return {
    findByIdentity: async () => [],
    completeUpload: async () => ({ status: "not_found" }),
    createUploadDraft: async (_input, receivedIdentity) => {
      assert.deepEqual(receivedIdentity, identity);
      return {
        clothing: {
          id: "clothing_1",
          name: input.name,
          category: input.category,
          color: input.color,
          sourceFileId: "cloud://env/clothing-sources/user_1/clothing_1.jpg",
          processingStatus: "draft",
          createdAt: "2026-07-22T08:00:00.000Z",
          updatedAt: "2026-07-22T08:00:00.000Z",
          version: 1,
        },
        uploadPath: "clothing-sources/user_1/clothing_1.jpg",
      } satisfies CreateClothingUploadResult;
    },
    ...overrides,
  };
}

test("使用可信身份创建用户隔离的衣物上传草稿", async () => {
  const result = await createClothingUpload(
    input,
    identity,
    repository(),
    "req_upload",
  );
  assert.equal(
    "data" in result && result.data.clothing.processingStatus,
    "draft",
  );
  assert.equal(
    "data" in result && result.data.uploadPath,
    "clothing-sources/user_1/clothing_1.jpg",
  );
});

test("拒绝无效图片元数据且不访问仓储", async () => {
  let called = false;
  const result = await createClothingUpload(
    { ...input, sizeBytes: 10 * 1024 * 1024 + 1 },
    identity,
    repository({
      createUploadDraft: async () => {
        called = true;
        throw new Error("must not run");
      },
    }),
    "req_invalid",
  );
  assert.equal(called, false);
  assert.deepEqual(result, {
    error: {
      code: "VALIDATION_ERROR",
      message: "请选择不超过 10 MB 的 JPG 或 PNG 图片",
      retryable: false,
    },
    requestId: "req_invalid",
  });
});

test("草稿创建失败返回可重试提示", async () => {
  const result = await createClothingUpload(
    input,
    identity,
    repository({
      createUploadDraft: async () => {
        throw new Error("database unavailable");
      },
    }),
    "req_fail",
  );
  assert.deepEqual(result, {
    error: {
      code: "INTERNAL_ERROR",
      message: "上传准备失败，请稍后重试",
      retryable: true,
    },
    requestId: "req_fail",
  });
});
