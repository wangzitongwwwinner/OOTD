import assert from "node:assert/strict";
import test from "node:test";
import type { PublicClothing } from "../../../../packages/contracts/src/index.ts";
import type { TrustedIdentity } from "../context.ts";
import { listClothing } from "./list-clothing.ts";
import type { ClothingRepository } from "./repository.ts";

const identity: TrustedIdentity = {
  openId: "trusted-open-id",
  appId: "trusted-app-id",
};
const item: PublicClothing = {
  id: "clothing_1",
  name: "白色棉质 T 恤",
  category: "top",
  color: "白色",
  sourceFileId: "cloud://source-1",
  processedFileId: "cloud://processed-1",
  processingStatus: "ready",
  createdAt: "2026-07-22T00:00:00.000Z",
  updatedAt: "2026-07-22T00:00:00.000Z",
  version: 1,
};

function repository(
  findByIdentity: ClothingRepository["findByIdentity"],
): ClothingRepository {
  return {
    findByIdentity,
    createUploadDraft: async () => {
      throw new Error("unused");
    },
    completeUpload: async () => ({ status: "not_found" }),
  };
}

test("使用可信微信身份查询并返回衣物列表", async () => {
  let received: TrustedIdentity | undefined;
  const clothingRepository = repository(async (value) => {
    received = value;
    return [item];
  });
  assert.deepEqual(
    await listClothing(identity, clothingRepository, "req_list"),
    { data: { items: [item] }, requestId: "req_list" },
  );
  assert.deepEqual(received, identity);
});

test("仓储失败时返回友好可重试错误", async () => {
  const clothingRepository = repository(async () => {
    throw new Error("database secret");
  });
  assert.deepEqual(
    await listClothing(identity, clothingRepository, "req_fail"),
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "衣橱加载失败，请稍后重试",
        retryable: true,
      },
      requestId: "req_fail",
    },
  );
});
