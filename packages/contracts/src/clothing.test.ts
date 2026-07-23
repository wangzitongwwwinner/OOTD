import assert from "node:assert/strict";
import test from "node:test";
import {
  clothingListSchema,
  clothingSchema,
  createClothingUploadRequestSchema,
  createClothingUploadResultSchema,
  completeClothingUploadRequestSchema,
  confirmCutoutJobRequestSchema,
  createCutoutJobRequestSchema,
  cutoutJobSchema,
  retryCutoutJobRequestSchema,
} from "./clothing.ts";

const ready = {
  id: "clothing_1",
  name: "白色棉质 T 恤",
  category: "top" as const,
  color: "白色",
  sourceFileId: "cloud://source-1",
  processedFileId: "cloud://processed-1",
  processingStatus: "ready" as const,
  createdAt: "2026-07-22T00:00:00.000Z",
  updatedAt: "2026-07-22T00:00:00.000Z",
  version: 1,
};

test("衣物契约限定类别、状态和公开字段", () => {
  assert.deepEqual(clothingSchema.parse(ready), ready);
  assert.equal(
    clothingSchema.safeParse({ ...ready, category: "dress" }).success,
    false,
  );
  assert.equal(
    clothingSchema.safeParse({ ...ready, processingStatus: "unknown" }).success,
    false,
  );
  assert.equal(
    clothingSchema.safeParse({ ...ready, userId: "secret" }).success,
    false,
  );
});

test("上传完成确认只接受云存储 fileID 和当前版本", () => {
  const valid = {
    fileId: "cloud://ootd-ai-dev.abc/clothing-sources/user_1/clothing_1.jpg",
    expectedVersion: 1,
  };
  assert.deepEqual(completeClothingUploadRequestSchema.parse(valid), valid);
  assert.equal(
    completeClothingUploadRequestSchema.safeParse({
      ...valid,
      fileId: "https://example.com/a.jpg",
    }).success,
    false,
  );
  assert.equal(
    completeClothingUploadRequestSchema.safeParse({
      ...valid,
      expectedVersion: 0,
    }).success,
    false,
  );
});

test("抠图任务请求拒绝客户端身份和无效版本", () => {
  const valid = { clothingId: "clothing_1", expectedVersion: 2 };
  assert.deepEqual(createCutoutJobRequestSchema.parse(valid), valid);
  assert.equal(
    createCutoutJobRequestSchema.safeParse({ ...valid, userId: "forged" })
      .success,
    false,
  );
  assert.equal(
    createCutoutJobRequestSchema.safeParse({ ...valid, expectedVersion: 0 })
      .success,
    false,
  );
});

test("抠图重试请求只接受任务版本", () => {
  assert.deepEqual(retryCutoutJobRequestSchema.parse({ expectedVersion: 2 }), {
    expectedVersion: 2,
  });
  assert.equal(
    retryCutoutJobRequestSchema.safeParse({ expectedVersion: 0 }).success,
    false,
  );
  assert.equal(
    retryCutoutJobRequestSchema.safeParse({ expectedVersion: 2, attempts: 99 })
      .success,
    false,
  );
});

test("确认入库请求只接受成功任务的当前版本", () => {
  assert.deepEqual(confirmCutoutJobRequestSchema.parse({ expectedVersion: 2 }), {
    expectedVersion: 2,
  });
  assert.equal(
    confirmCutoutJobRequestSchema.safeParse({ expectedVersion: 0 }).success,
    false,
  );
  assert.equal(
    confirmCutoutJobRequestSchema.safeParse({
      expectedVersion: 2,
      userId: "forged",
    }).success,
    false,
  );
});

test("抠图任务仅在成功时公开处理后文件", () => {
  const base = {
    id: "cutout_1",
    clothingId: "clothing_1",
    status: "processing" as const,
    attempts: 1,
    createdAt: "2026-07-22T08:00:00.000Z",
    updatedAt: "2026-07-22T08:00:01.000Z",
    version: 1,
  };
  assert.deepEqual(cutoutJobSchema.parse(base), base);
  assert.equal(
    cutoutJobSchema.safeParse({
      ...base,
      processedFileId: "cloud://processed.png",
    }).success,
    false,
  );
  assert.equal(
    cutoutJobSchema.safeParse({ ...base, status: "succeeded" }).success,
    false,
  );
  assert.equal(
    cutoutJobSchema.safeParse({
      ...base,
      status: "succeeded",
      processedFileId: "cloud://processed.png",
    }).success,
    true,
  );
  assert.equal(
    cutoutJobSchema.safeParse({ ...base, status: "unknown" }).success,
    false,
  );
});

test("待确认和已就绪衣物可公开处理后文件", () => {
  assert.equal(
    clothingSchema.safeParse({ ...ready, processingStatus: "review" }).success,
    true,
  );
  assert.equal(
    clothingSchema.safeParse({ ...ready, processingStatus: "processing" })
      .success,
    false,
  );
  const processing = { ...ready, processingStatus: "processing" as const };
  delete (processing as { processedFileId?: string }).processedFileId;
  assert.equal(clothingSchema.safeParse(processing).success, true);
  assert.deepEqual(clothingListSchema.parse({ items: [ready] }), {
    items: [ready],
  });
});

test("衣物上传请求只接受 JPG/PNG 且不超过 10 MB", () => {
  const valid = {
    name: "白色棉质 T 恤",
    category: "top",
    color: "白色",
    extension: "jpg",
    mimeType: "image/jpeg",
    sizeBytes: 1024,
  } as const;

  assert.deepEqual(createClothingUploadRequestSchema.parse(valid), valid);
  assert.equal(
    createClothingUploadRequestSchema.safeParse({
      ...valid,
      extension: "gif",
      mimeType: "image/gif",
    }).success,
    false,
  );
  assert.equal(
    createClothingUploadRequestSchema.safeParse({
      ...valid,
      sizeBytes: 10 * 1024 * 1024 + 1,
    }).success,
    false,
  );
  assert.equal(
    createClothingUploadRequestSchema.safeParse({ ...valid, userId: "forged" })
      .success,
    false,
  );
});

test("衣物上传初始化结果包含服务端生成的隔离路径和草稿", () => {
  const { processedFileId: _processedFileId, ...draft } = ready;
  const result = {
    clothing: { ...draft, processingStatus: "draft" as const },
    uploadPath: "clothing-sources/user_1/clothing_1.jpg",
  };
  assert.deepEqual(createClothingUploadResultSchema.parse(result), result);
});
