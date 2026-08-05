import assert from "node:assert/strict";
import test from "node:test";
import type { ClothingRepository } from "./repository.ts";
import { updateClothing } from "./update-clothing.ts";

function repositoryFixture(
  opts: {
    findByIdentity?: ClothingRepository["findByIdentity"];
    update?: ClothingRepository["update"];
  } = {},
): ClothingRepository {
  return {
    findByIdentity: opts.findByIdentity ?? (async () => []),
    createUploadDraft: async () => {
      throw new Error("unexpected");
    },
    completeUpload: async () => {
      throw new Error("unexpected");
    },
    update:
      opts.update ??
      (async () => ({ status: "updated", clothing: baseClothing })),
    delete: async () => ({ status: "not_found" }),
  };
}

const baseClothing = {
  id: "clothing_1",
  name: "蓝色牛仔裤",
  category: "bottom" as const,
  color: "蓝色",
  sourceFileId: "cloud://source.jpg",
  processedFileId: "cloud://processed.png",
  processingStatus: "ready" as const,
  createdAt: "2026-07-23T08:00:00.000Z",
  updatedAt: "2026-07-23T08:00:00.000Z",
  version: 5,
};

test("以可信身份和版本更新衣物字段", async () => {
  const identity = { openId: "open-1", appId: "app-1" };
  let called: { id?: string; input?: unknown; identity?: unknown } = {};
  const repository = repositoryFixture({
    update: async (id, input, ident) => {
      called = { id, input, identity: ident };
      return { status: "updated", clothing: baseClothing };
    },
  });
  const result = await updateClothing(
    "clothing_1",
    {
      name: "蓝色牛仔裤",
      category: "bottom",
      color: "蓝色",
      expectedVersion: 4,
    },
    identity,
    repository,
    "req_1",
  );
  assert.equal(called.id, "clothing_1");
  assert.deepEqual(called.identity, identity);
  assert.equal("data" in result, true);
  if ("data" in result) {
    assert.equal(result.data.name, "蓝色牛仔裤");
  }
});

test("仓储返回 not_found 映射为 NOT_FOUND 错误", async () => {
  const repository = repositoryFixture({
    update: async () => ({ status: "not_found" }),
  });
  const result = await updateClothing(
    "clothing_1",
    {
      name: "x",
      category: "top",
      color: "白",
      expectedVersion: 4,
    },
    { openId: "open-1", appId: "app-1" },
    repository,
    "req_2",
  );
  assert.equal("error" in result, true);
  if ("error" in result) {
    assert.equal(result.error.code, "NOT_FOUND");
  }
});

test("仓储返回 conflict 映射为 CONFLICT 错误", async () => {
  const repository = repositoryFixture({
    update: async () => ({ status: "conflict" }),
  });
  const result = await updateClothing(
    "clothing_1",
    {
      name: "x",
      category: "top",
      color: "白",
      expectedVersion: 4,
    },
    { openId: "open-1", appId: "app-1" },
    repository,
    "req_3",
  );
  assert.equal("error" in result, true);
  if ("error" in result) {
    assert.equal(result.error.code, "CONFLICT");
    assert.equal(result.error.retryable, true);
  }
});

test("仓储异常返回可重试内部错误", async () => {
  const repository = repositoryFixture({
    update: async () => {
      throw new Error("db down");
    },
  });
  const result = await updateClothing(
    "clothing_1",
    {
      name: "x",
      category: "top",
      color: "白",
      expectedVersion: 4,
    },
    { openId: "open-1", appId: "app-1" },
    repository,
    "req_4",
  );
  assert.equal("error" in result, true);
  if ("error" in result) {
    assert.equal(result.error.retryable, true);
  }
});
