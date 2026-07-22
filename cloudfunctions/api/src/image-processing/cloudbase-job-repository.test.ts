import assert from "node:assert/strict";
import test from "node:test";

import { CloudBaseCutoutJobRepository } from "./cloudbase-job-repository.ts";

function databaseFixture(clothingVersion = 2) {
  const added: Record<string, unknown>[] = [];
  const updates: Record<string, unknown>[] = [];
  const users = [
    {
      id: "user_1",
      wechatOpenId: "trusted-open-id",
      wechatAppId: "trusted-app-id",
    },
  ];
  const clothing = [
    {
      id: "clothing_1",
      userId: "user_1",
      sourceFileId: "cloud://source.jpg",
      processingStatus: "draft",
      version: clothingVersion,
    },
  ];
  const jobs = [
    {
      id: "cutout_existing",
      clothingId: "clothing_1",
      userId: "user_1",
      status: "processing",
      attempts: 1,
      sourceFileId: "cloud://source.jpg",
      providerTaskId: "mps_1",
      createdAt: "2026-07-22T08:00:00.000Z",
      updatedAt: "2026-07-22T08:00:00.000Z",
      version: 1,
    },
  ];
  const collection = (name: string) => ({
    where(query: Record<string, unknown>) {
      const source =
        name === "users"
          ? users
          : name === "clothing"
            ? clothing
            : name === "image_processing_jobs"
              ? jobs
              : [];
      const matched = source.filter((item) =>
        Object.entries(query).every(
          ([key, value]) => item[key as keyof typeof item] === value,
        ),
      );
      return {
        limit() {
          return this;
        },
        async get() {
          return { data: matched };
        },
        async update(value: Record<string, unknown>) {
          updates.push(value);
          return { updated: matched.length };
        },
        async remove() {
          return { deleted: matched.length };
        },
      };
    },
    async add(value: Record<string, unknown>) {
      added.push(value);
      return { id: String(value.id) };
    },
  });
  return { database: { collection } as never, added, updates };
}

test("以可信身份和版本创建用户隔离任务并把衣物置为处理中", async () => {
  const fixture = databaseFixture();
  const repository = new CloudBaseCutoutJobRepository(fixture.database);
  const result = await repository.begin(
    { clothingId: "clothing_1", expectedVersion: 2 },
    { openId: "trusted-open-id", appId: "trusted-app-id" },
  );
  assert.equal(result.status, "created");
  assert.equal(fixture.added[0]?.userId, "user_1");
  assert.deepEqual(fixture.updates[0], {
    processingStatus: "processing",
    updatedAt: fixture.updates[0]?.updatedAt,
    version: 3,
  });
});

test("版本不匹配时不创建任务", async () => {
  const fixture = databaseFixture(3);
  const repository = new CloudBaseCutoutJobRepository(fixture.database);
  const result = await repository.begin(
    { clothingId: "clothing_1", expectedVersion: 2 },
    { openId: "trusted-open-id", appId: "trusted-app-id" },
  );
  assert.equal(result.status, "conflict");
  assert.equal(fixture.added.length, 0);
});

test("查询任务时移除用户和数据库内部字段", async () => {
  const fixture = databaseFixture();
  const repository = new CloudBaseCutoutJobRepository(fixture.database);
  const job = await repository.findById("cutout_existing", {
    openId: "trusted-open-id",
    appId: "trusted-app-id",
  });
  assert.equal(job?.providerTaskId, "mps_1");
  assert.equal(job?.sourceFileId, "cloud://source.jpg");
  assert.equal("userId" in (job ?? {}), false);
});
