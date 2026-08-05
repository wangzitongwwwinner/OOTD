import assert from "node:assert/strict";
import test from "node:test";

import { listScenes } from "./list-scenes.ts";
import type { SceneRepository } from "./scene-repository.ts";

test("返回稳定预设和当前可信身份的自定义场景", async () => {
  let receivedIdentity: unknown;
  const repository: SceneRepository = {
    findCustomByIdentity: async (identity) => {
      receivedIdentity = identity;
      return [
        {
          id: "scene_gym",
          name: "健身房",
          category: "custom",
          estimatedTemperatureCelsius: 24,
          feel: "stuffy",
          isPreset: false,
          note: "运动时偏热",
          createdAt: "2026-07-20T01:00:00.000Z",
          updatedAt: "2026-07-20T01:00:00.000Z",
          version: 1,
        },
      ];
    },
    create: async () => ({
      id: "x",
      name: "x",
      category: "custom",
      estimatedTemperatureCelsius: 22,
      feel: "comfortable",
      isPreset: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      version: 1,
    }),
    findById: async () => undefined,
    update: async () => ({ status: "not_found" }),
    delete: async () => ({ status: "not_found" }),
  };

  const response = await listScenes(
    { openId: "trusted-open-id", appId: "trusted-app-id" },
    repository,
    "req_scenes",
  );

  assert.deepEqual(receivedIdentity, {
    openId: "trusted-open-id",
    appId: "trusted-app-id",
  });
  assert.equal("data" in response && response.data.items.length, 1);
  assert.equal("data" in response && response.data.items[0]?.name, "健身房");
});

test("仓储失败返回友好可重试错误", async () => {
  const repository: SceneRepository = {
    findCustomByIdentity: async () => {
      throw new Error("database secret");
    },
    create: async () => ({
      id: "x",
      name: "x",
      category: "custom",
      estimatedTemperatureCelsius: 22,
      feel: "comfortable",
      isPreset: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      version: 1,
    }),
    findById: async () => undefined,
    update: async () => ({ status: "not_found" }),
    delete: async () => ({ status: "not_found" }),
  };
  assert.deepEqual(
    await listScenes(
      { openId: "trusted-open-id", appId: "trusted-app-id" },
      repository,
      "req_scenes_error",
    ),
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "场景加载失败，请稍后重试",
        retryable: true,
      },
      requestId: "req_scenes_error",
    },
  );
});
