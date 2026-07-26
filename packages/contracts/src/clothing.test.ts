import assert from "node:assert/strict";
import test from "node:test";

import {
  clothingSchema,
  clothingListSchema,
  createClothingUploadRequestSchema,
  createClothingUploadResultSchema,
  completeClothingUploadRequestSchema,
  createCutoutJobRequestSchema,
  retryCutoutJobRequestSchema,
  confirmCutoutJobRequestSchema,
  cutoutJobSchema,
  updateClothingRequestSchema,
  deleteClothingRequestSchema,
} from "./clothing.ts";

const baseClothing = {
  id: "clothing_1",
  name: "白色 T 恤",
  category: "top" as const,
  color: "白色",
  sourceFileId: "cloud://source.jpg",
  processedFileId: "cloud://processed.png",
  processingStatus: "ready" as const,
  createdAt: "2026-07-23T08:00:00.000Z",
  updatedAt: "2026-07-23T08:00:00.000Z",
  version: 4,
};

test("删除衣物请求仅接受可选的引用移除确认标记", () => {
  assert.equal(
    deleteClothingRequestSchema.safeParse({
      expectedVersion: 2,
      confirmReferencedRemoval: true,
    }).success,
    true,
  );
  assert.equal(
    deleteClothingRequestSchema.safeParse({
      expectedVersion: 2,
      confirmReferencedRemoval: "true",
    }).success,
    false,
  );
});

// --- PublicClothing ---
test("衣物契约限定类别、状态和公开字段", () => {
  assert.equal(clothingSchema.safeParse(baseClothing).success, true);
  assert.equal(
    clothingSchema.safeParse({ ...baseClothing, version: "4" }).success,
    false,
  );
  assert.equal(
    clothingSchema.safeParse({ ...baseClothing, userId: "u1" }).success,
    false,
  );
});

test("上传完成确认只接受云存储 fileID 和当前版本", () => {
  assert.equal(
    completeClothingUploadRequestSchema.safeParse({
      fileId:
        "cloud://ootd-ai-dev-d6g5hzex6925fcea7.6f6f-ootd-ai-dev-d6g5hzex6925fcea7-1454762194/clothing-sources/user_1/clothing_1.jpg",
      expectedVersion: 1,
    }).success,
    true,
  );
  assert.equal(
    completeClothingUploadRequestSchema.safeParse({
      fileId: "/local/path.jpg",
      expectedVersion: 1,
    }).success,
    false,
  );
});

test("抠图任务请求拒绝客户端身份和无效版本", () => {
  assert.equal(
    createCutoutJobRequestSchema.safeParse({
      clothingId: "clothing_1",
      expectedVersion: 2,
    }).success,
    true,
  );
  assert.equal(
    createCutoutJobRequestSchema.safeParse({
      clothingId: "clothing_1",
      expectedVersion: 0,
    }).success,
    false,
  );
});

test("抠图重试请求只接受任务版本", () => {
  assert.equal(
    retryCutoutJobRequestSchema.safeParse({ expectedVersion: 1 }).success,
    true,
  );
  assert.equal(
    retryCutoutJobRequestSchema.safeParse({ expectedVersion: -1 }).success,
    false,
  );
});

test("确认入库请求只接受成功任务的当前版本", () => {
  assert.equal(
    confirmCutoutJobRequestSchema.safeParse({ expectedVersion: 2 }).success,
    true,
  );
  assert.equal(
    confirmCutoutJobRequestSchema.safeParse({ expectedVersion: 0 }).success,
    false,
  );
});

test("抠图任务仅在成功时公开处理后文件", () => {
  const succeeded = cutoutJobSchema.safeParse({
    id: "cutout_1",
    clothingId: "clothing_1",
    status: "succeeded",
    attempts: 1,
    processedFileId: "cloud://processed.png",
    createdAt: "2026-07-23T08:00:00.000Z",
    updatedAt: "2026-07-23T08:00:00.000Z",
    version: 3,
  });
  assert.equal(succeeded.success, true);
  const failed = cutoutJobSchema.safeParse({
    id: "cutout_1",
    clothingId: "clothing_1",
    status: "failed",
    attempts: 1,
    processedFileId: "cloud://processed.png",
    createdAt: "2026-07-23T08:00:00.000Z",
    updatedAt: "2026-07-23T08:00:00.000Z",
    version: 3,
  });
  assert.equal(failed.success, false);
});

test("待确认和已就绪衣物可公开处理后文件", () => {
  assert.equal(
    clothingSchema.safeParse(baseClothing).success,
    true,
  );
  assert.equal(
    clothingSchema.safeParse({
      ...baseClothing,
      processingStatus: "review",
    }).success,
    true,
  );
});

test("衣物上传请求只接受 JPG/PNG 且不超过 10 MB", () => {
  const valid = {
    name: "白衬衫",
    category: "top",
    color: "白色",
    extension: "jpg",
    mimeType: "image/jpeg",
    sizeBytes: 1024,
  };
  assert.equal(
    createClothingUploadRequestSchema.safeParse(valid).success,
    true,
  );
  assert.equal(
    createClothingUploadRequestSchema.safeParse({
      ...valid,
      extension: "gif",
    }).success,
    false,
  );
  assert.equal(
    createClothingUploadRequestSchema.safeParse({
      ...valid,
      sizeBytes: 20 * 1024 * 1024,
    }).success,
    false,
  );
});

test("衣物上传初始化结果包含服务端生成的隔离路径和草稿", () => {
  const result = createClothingUploadResultSchema.safeParse({
    clothing: baseClothing,
    uploadPath: "clothing-sources/user_1/clothing_1.jpg",
  });
  assert.equal(result.success, true);
  assert.equal(
    createClothingUploadResultSchema.safeParse({
      clothing: baseClothing,
      uploadPath: "/local/tmp.jpg",
    }).success,
    false,
  );
});

test("列表 schema 接收公开衣物数组", () => {
  assert.equal(
    clothingListSchema.safeParse({ items: [baseClothing] }).success,
    true,
  );
  assert.equal(
    clothingListSchema.safeParse({ items: [{ ...baseClothing, userId: "1" }] })
      .success,
    false,
  );
});

// --- UpdateClothingRequest ---
test("更新衣物只接受名称、类别、颜色和版本", () => {
  const valid = {
    name: "白色亚麻衬衫",
    category: "top",
    color: "米白",
    expectedVersion: 3,
  };
  assert.equal(updateClothingRequestSchema.safeParse(valid).success, true);
});

test("更新衣物拒绝缺失字段、无效类别和额外字段", () => {
  assert.equal(
    updateClothingRequestSchema.safeParse({
      name: "",
      category: "top",
      color: "白",
      expectedVersion: 1,
    }).success,
    false,
  );
  assert.equal(
    updateClothingRequestSchema.safeParse({
      name: "x",
      category: "hat",
      color: "白",
      expectedVersion: 1,
    }).success,
    false,
  );
  assert.equal(
    updateClothingRequestSchema.safeParse({
      name: "x",
      category: "top",
      color: "白",
      expectedVersion: 1,
      extra: true,
    }).success,
    false,
  );
});
test("删除衣物只接受当前正整数版本", () => {
  assert.equal(
    deleteClothingRequestSchema.safeParse({ expectedVersion: 3 }).success,
    true,
  );
  assert.equal(
    deleteClothingRequestSchema.safeParse({ expectedVersion: 0 }).success,
    false,
  );
});
