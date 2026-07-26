import assert from "node:assert/strict";
import test from "node:test";

import type {
  PublicClothing,
  PublicOutfit,
} from "../../../../packages/contracts/src/index.ts";
import type { ClothingRepository } from "../clothing/repository.ts";
import { createOutfit, deleteOutfit, getOutfit, listOutfits } from "./manage-outfits.ts";
import type { OutfitRepository } from "./repository.ts";

const identity = { openId: "trusted-open-id", appId: "trusted-app-id" };
const outfit: PublicOutfit = {
  id: "outfit_1",
  name: "周一通勤",
  seasonTags: ["春秋"],
  colorTags: ["米白"],
  canvasVersion: 1,
  nodes: [
    {
      clothingId: "clothing_1",
      x: 0.4,
      y: 0.2,
      scale: 1,
      rotation: 0,
      zIndex: 1,
    },
  ],
  createdAt: "2026-07-26T08:00:00.000Z",
  updatedAt: "2026-07-26T08:00:00.000Z",
  version: 1,
};
const clothing: PublicClothing = {
  id: "clothing_1",
  name: "白衬衫",
  category: "top",
  color: "白色",
  sourceFileId: "cloud://source.jpg",
  processedFileId: "cloud://processed.png",
  processingStatus: "ready",
  createdAt: "2026-07-26T07:00:00.000Z",
  updatedAt: "2026-07-26T07:00:00.000Z",
  version: 1,
};

function outfitRepository(
  overrides: Partial<OutfitRepository> = {},
): OutfitRepository {
  return {
    listByIdentity: async () => [],
    findById: async () => undefined,
    create: async () => outfit,
    delete: async () => ({ status: "deleted" }),
    ...overrides,
  };
}

function clothingRepository(items = [clothing]): ClothingRepository {
  return {
    findByIdentity: async () => items,
    createUploadDraft: async () => {
      throw new Error("not used");
    },
    completeUpload: async () => ({ status: "not_found" }),
    update: async () => ({ status: "not_found" }),
    delete: async () => ({ status: "not_found" }),
  };
}

test("保存搭配使用可信身份并校验节点衣物所有权", async () => {
  let receivedIdentity: unknown;
  const repository = outfitRepository({
    create: async (_input, trustedIdentity) => {
      receivedIdentity = trustedIdentity;
      return outfit;
    },
  });

  const response = await createOutfit(
    {
      name: "周一通勤",
      seasonTags: ["春秋"],
      colorTags: ["米白"],
      canvasVersion: 1,
      nodes: outfit.nodes,
    },
    identity,
    repository,
    clothingRepository(),
    "req_create",
  );

  assert.deepEqual(receivedIdentity, identity);
  assert.deepEqual(response, { data: outfit, requestId: "req_create" });
});

test("按可信身份和期望版本删除搭配", async () => {
  let received: unknown;
  const response = await deleteOutfit(
    "outfit_1",
    { expectedVersion: 1 },
    identity,
    outfitRepository({
      delete: async (id, input, trustedIdentity) => {
        received = { id, input, trustedIdentity };
        return { status: "deleted" };
      },
    }),
    "req_delete",
  );
  assert.deepEqual(received, {
    id: "outfit_1",
    input: { expectedVersion: 1 },
    trustedIdentity: identity,
  });
  assert.deepEqual(response, { data: {}, requestId: "req_delete" });
});

test("节点引用不属于当前用户的衣物时拒绝保存", async () => {
  const response = await createOutfit(
    {
      name: "越权搭配",
      seasonTags: [],
      colorTags: [],
      canvasVersion: 1,
      nodes: [{ ...outfit.nodes[0], clothingId: "other_clothing" }],
    },
    identity,
    outfitRepository(),
    clothingRepository(),
    "req_forbidden",
  );

  assert.deepEqual(response, {
    error: {
      code: "FORBIDDEN",
      message: "搭配中包含不可用的衣物，请刷新后重试",
      retryable: false,
    },
    requestId: "req_forbidden",
  });
});

test("搭配列表和详情仅从可信身份仓储读取", async () => {
  let listIdentity: unknown;
  let detailIdentity: unknown;
  const repository = outfitRepository({
    listByIdentity: async (trustedIdentity) => {
      listIdentity = trustedIdentity;
      return [outfit];
    },
    findById: async (_id, trustedIdentity) => {
      detailIdentity = trustedIdentity;
      return outfit;
    },
  });

  assert.deepEqual(await listOutfits(identity, repository, "req_list"), {
    data: { items: [outfit] },
    requestId: "req_list",
  });
  assert.deepEqual(
    await getOutfit("outfit_1", identity, repository, "req_detail"),
    { data: outfit, requestId: "req_detail" },
  );
  assert.deepEqual(listIdentity, identity);
  assert.deepEqual(detailIdentity, identity);
});

test("不存在的搭配详情返回友好错误", async () => {
  const response = await getOutfit(
    "missing",
    identity,
    outfitRepository(),
    "req_missing",
  );

  assert.deepEqual(response, {
    error: {
      code: "NOT_FOUND",
      message: "搭配不存在或已删除",
      retryable: false,
    },
    requestId: "req_missing",
  });
});
