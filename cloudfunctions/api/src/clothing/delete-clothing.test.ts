import assert from "node:assert/strict";
import test from "node:test";
import type { ClothingRepository } from "./repository.ts";
import { deleteClothing } from "./delete-clothing.ts";

function repoFixture(opts: { delete?: ClothingRepository["delete"] } = {}): ClothingRepository {
  return {
    findByIdentity: async () => [],
    createUploadDraft: async () => { throw new Error("unused"); },
    completeUpload: async () => { throw new Error("unused"); },
    update: async () => { throw new Error("unused"); },
    delete: opts.delete ?? (async () => ({ status: "deleted" })),
  };
}

test("以可信身份和版本删除已确认衣物", async () => {
  const identity = { openId: "open-1", appId: "app-1" };
  let called = {} as Record<string, unknown>;
  const repo = repoFixture({
    delete: async (id, input, ident) => { called = { id, input, identity: ident }; return { status: "deleted" }; },
  });
  const result = await deleteClothing("clothing_1", { expectedVersion: 4 }, identity, repo, "req_1");
  assert.equal(called.id, "clothing_1");
  assert.deepEqual(called.identity, identity);
  assert.deepEqual(result, { data: {}, requestId: "req_1" });
});

test("not_found 映射为 NOT_FOUND 错误", async () => {
  const repo = repoFixture({ delete: async () => ({ status: "not_found" }) });
  const result = await deleteClothing("clothing_1", { expectedVersion: 4 }, { openId: "o", appId: "a" }, repo, "req");
  assert.equal("error" in result, true);
  if ("error" in result) assert.equal(result.error.code, "NOT_FOUND");
});

test("conflict 映射为 CONFLICT 可重试错误", async () => {
  const repo = repoFixture({ delete: async () => ({ status: "conflict" }) });
  const result = await deleteClothing("clothing_1", { expectedVersion: 4 }, { openId: "o", appId: "a" }, repo, "req");
  assert.equal("error" in result, true);
  if ("error" in result) { assert.equal(result.error.code, "CONFLICT"); assert.equal(result.error.retryable, true); }
});

test("仓储异常返回可重试内部错误", async () => {
  const repo = repoFixture({ delete: async () => { throw new Error("db down"); } });
  const result = await deleteClothing("clothing_1", { expectedVersion: 4 }, { openId: "o", appId: "a" }, repo, "req");
  assert.equal("error" in result, true);
  if ("error" in result) assert.equal(result.error.retryable, true);
});

test("被搭配引用且未确认时返回专用错误", async () => {
  const repo = repoFixture({
    delete: async () => ({ status: "referenced", referenceCount: 2 }),
  });
  const result = await deleteClothing(
    "clothing_1",
    { expectedVersion: 4 },
    { openId: "o", appId: "a" },
    repo,
    "req",
  );
  assert.equal("error" in result, true);
  if ("error" in result) {
    assert.equal(result.error.code, "CLOTHING_REFERENCED");
    assert.equal(result.error.retryable, false);
  }
});
