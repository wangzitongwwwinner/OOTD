import assert from "node:assert/strict";
import test from "node:test";

import { CloudBaseOutfitRepository } from "./cloudbase-outfit-repository.ts";

function databaseFixture() {
  const added: Record<string, unknown>[] = [];
  const users = [
    {
      id: "user_1",
      wechatOpenId: "trusted-open-id",
      wechatAppId: "trusted-app-id",
    },
  ];
  const outfits = [
    {
      _id: "database_internal_id",
      id: "outfit_1",
      userId: "user_1",
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
    },
  ];
  const collection = (name: string) => ({
    where(query: Record<string, unknown>) {
      const source =
        name === "users" ? users : name === "outfits" ? outfits : [];
      const matched = source.filter((item) =>
        Object.entries(query).every(
          ([key, value]) => item[key as keyof typeof item] === value,
        ),
      );
      const chain = {
        orderBy() {
          return chain;
        },
        limit() {
          return chain;
        },
        async get() {
          return { data: matched };
        },
      };
      return chain;
    },
    async add(value: Record<string, unknown>) {
      added.push(value);
      return { id: String(value.id) };
    },
  });
  return { database: { collection } as never, added };
}

test("按可信身份查询搭配并移除用户及数据库内部字段", async () => {
  const fixture = databaseFixture();
  const repository = new CloudBaseOutfitRepository(fixture.database);
  const items = await repository.listByIdentity({
    openId: "trusted-open-id",
    appId: "trusted-app-id",
  });

  assert.equal(items.length, 1);
  assert.equal(items[0]?.id, "outfit_1");
  assert.equal("userId" in (items[0] ?? {}), false);
  assert.equal("_id" in (items[0] ?? {}), false);
});

test("详情查询同时校验搭配 ID 和当前用户", async () => {
  const fixture = databaseFixture();
  const repository = new CloudBaseOutfitRepository(fixture.database);

  assert.equal(
    (
      await repository.findById("outfit_1", {
        openId: "trusted-open-id",
        appId: "trusted-app-id",
      })
    )?.name,
    "周一通勤",
  );
  assert.equal(
    await repository.findById("missing", {
      openId: "trusted-open-id",
      appId: "trusted-app-id",
    }),
    undefined,
  );
});

test("创建搭配由服务端生成用户、ID、时间和版本", async () => {
  const fixture = databaseFixture();
  const repository = new CloudBaseOutfitRepository(fixture.database);
  const created = await repository.create(
    {
      name: "周末散步",
      seasonTags: ["夏"],
      colorTags: ["蓝色"],
      canvasVersion: 1,
      nodes: [
        {
          clothingId: "clothing_1",
          x: 0.3,
          y: 0.4,
          scale: 1,
          rotation: 0,
          zIndex: 0,
        },
      ],
    },
    { openId: "trusted-open-id", appId: "trusted-app-id" },
  );

  assert.match(created.id, /^outfit_/);
  assert.equal(created.version, 1);
  assert.equal(fixture.added[0]?.userId, "user_1");
  assert.equal("userId" in created, false);
});
