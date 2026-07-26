import assert from "node:assert/strict";
import test from "node:test";
import type { ClothingRepository } from "./repository.ts";
import { completeClothingUpload } from "./complete-upload.ts";

const identity = { openId: "trusted-open-id", appId: "trusted-app-id" };
const clothing = {
  id: "clothing_1",
  name: "新衣物",
  category: "top" as const,
  color: "待补充",
  sourceFileId: "cloud://env/clothing-sources/user_1/clothing_1.jpg",
  processingStatus: "draft" as const,
  createdAt: "2026-07-22T08:00:00.000Z",
  updatedAt: "2026-07-22T08:01:00.000Z",
  version: 2,
};

test("仅以可信身份确认上传后的正式 fileID", async () => {
  let received = identity;
  const repository: ClothingRepository = {
    findByIdentity: async () => [],
    createUploadDraft: async () => {
      throw new Error("unused");
    },
    completeUpload: async (_id, _input, trusted) => {
      received = trusted;
      return { status: "updated", clothing };
    },
    update: async () => ({ status: "not_found" }),
    delete: async () => ({ status: "not_found" }),
  };
  const result = await completeClothingUpload(
    "clothing_1",
    {
      fileId: clothing.sourceFileId,
      expectedVersion: 1,
    },
    identity,
    repository,
    "req_complete",
  );
  assert.deepEqual(received, identity);
  assert.equal("data" in result && result.data.version, 2);
});

test("其他用户或不存在草稿统一返回 NOT_FOUND", async () => {
  const repository: ClothingRepository = {
    findByIdentity: async () => [],
    createUploadDraft: async () => {
      throw new Error("unused");
    },
    completeUpload: async () => ({ status: "not_found" }),
    update: async () => ({ status: "not_found" }),
    delete: async () => ({ status: "not_found" }),
  };
  const result = await completeClothingUpload(
    "clothing_1",
    { fileId: clothing.sourceFileId, expectedVersion: 1 },
    identity,
    repository,
    "req_missing",
  );
  assert.deepEqual(result, {
    error: { code: "NOT_FOUND", message: "衣物草稿不存在", retryable: false },
    requestId: "req_missing",
  });
});
