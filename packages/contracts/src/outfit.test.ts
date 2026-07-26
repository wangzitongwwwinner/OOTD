import assert from "node:assert/strict";
import test from "node:test";

import {
  createOutfitRequestSchema,
  outfitListSchema,
  publicOutfitSchema,
} from "./outfit.ts";

const validNode = {
  clothingId: "clothing_1",
  x: 0.5,
  y: 0.25,
  scale: 1.2,
  rotation: 0,
  zIndex: 2,
};

const validRequest = {
  name: "周一通勤",
  seasonTags: ["春秋"],
  colorTags: ["米白"],
  canvasVersion: 1,
  nodes: [validNode],
};

const publicOutfit = {
  id: "outfit_1",
  ...validRequest,
  createdAt: "2026-07-26T08:00:00.000Z",
  updatedAt: "2026-07-26T08:00:00.000Z",
  version: 1,
};

test("创建搭配只接受归一化画布节点和公开字段", () => {
  assert.equal(createOutfitRequestSchema.safeParse(validRequest).success, true);
  assert.equal(
    createOutfitRequestSchema.safeParse({
      ...validRequest,
      userId: "forged-user",
    }).success,
    false,
  );
  assert.equal(
    createOutfitRequestSchema.safeParse({
      ...validRequest,
      nodes: [{ ...validNode, x: 1.01 }],
    }).success,
    false,
  );
  assert.equal(
    createOutfitRequestSchema.safeParse({
      ...validRequest,
      nodes: [{ ...validNode, scale: 3.01 }],
    }).success,
    false,
  );
});

test("创建搭配拒绝空名称和空画布", () => {
  assert.equal(
    createOutfitRequestSchema.safeParse({ ...validRequest, name: " " }).success,
    false,
  );
  assert.equal(
    createOutfitRequestSchema.safeParse({ ...validRequest, nodes: [] }).success,
    false,
  );
});

test("公开搭配和列表不允许泄露用户身份", () => {
  assert.equal(publicOutfitSchema.safeParse(publicOutfit).success, true);
  assert.equal(
    publicOutfitSchema.safeParse({ ...publicOutfit, userId: "user_1" }).success,
    false,
  );
  assert.equal(
    outfitListSchema.safeParse({ items: [publicOutfit] }).success,
    true,
  );
});
