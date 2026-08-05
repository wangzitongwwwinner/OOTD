import assert from "node:assert/strict";
import test from "node:test";
import type { Db } from "@cloudbase/database";

import { CloudBaseSceneRepository } from "./cloudbase-scene-repository.ts";

function createDatabase() {
  const data: Record<string, Array<Record<string, unknown>>> = {
    users: [
      {
        _id: "db_user_1",
        id: "user_1",
        wechatOpenId: "openid",
        wechatAppId: "appid",
      },
    ],
    scenes: [],
  };
  const collection = (name: string) => ({
    where(query: Record<string, unknown>) {
      const matches = () =>
        data[name]!.filter((item) =>
          Object.entries(query).every(([key, value]) => item[key] === value),
        );
      return {
        limit() {
          return { get: async () => ({ data: matches() }) };
        },
        orderBy() {
          return {
            limit() {
              return { get: async () => ({ data: matches() }) };
            },
          };
        },
        async update(value: Record<string, unknown>) {
          for (const item of matches()) Object.assign(item, value);
        },
        async remove() {
          const removing = new Set(matches());
          data[name] = data[name]!.filter((item) => !removing.has(item));
        },
      };
    },
    doc(id: string) {
      return {
        async set(value: Record<string, unknown>) {
          const existing = data[name]!.find((item) => item._id === id);
          if (existing) Object.assign(existing, value);
          else data[name]!.push({ ...value, _id: id });
        },
        async update(value: Record<string, unknown>) {
          const existing = data[name]!.find((item) => item._id === id);
          if (existing) Object.assign(existing, value);
        },
      };
    },
    async add(value: Record<string, unknown>) {
      data[name]!.push({ ...value, _id: String(value.id) });
    },
  });
  return { database: { collection } as unknown as Db, data };
}

test("场景示例按用户幂等初始化，可用公共 ID 续接编辑且删除后不回填", async () => {
  const { database, data } = createDatabase();
  const repository = new CloudBaseSceneRepository(database);
  const identity = { openId: "openid", appId: "appid" };

  const first = await repository.findCustomByIdentity(identity);
  assert.equal(first.length, 4);
  assert.equal(data.users![0]!.sceneExamplesInitializedVersion, 1);
  assert.ok(data.scenes!.every((scene) => scene.userId === "user_1"));

  const updated = await repository.update(
    "preset_office",
    {
      name: "冬季办公室",
      category: "office",
      estimatedTemperatureCelsius: 24,
      feel: "comfortable",
      expectedVersion: 1,
    },
    identity,
  );
  assert.equal(updated.status, "updated");
  assert.equal(updated.status === "updated" && updated.scene.name, "冬季办公室");

  assert.deepEqual(await repository.delete("preset_home", identity), {
    status: "deleted",
  });
  const second = await repository.findCustomByIdentity(identity);
  assert.equal(second.length, 3);
  assert.equal(second.some((scene) => scene.name === "家"), false);
});
