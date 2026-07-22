import assert from "node:assert/strict";
import test from "node:test";

import { createScene, updateScene } from "./manage-scenes.ts";
import type { SceneRepository } from "./scene-repository.ts";
import type { Scene } from "../../../../packages/contracts/src/index.ts";

const identity = { openId: "trusted-open-id", appId: "trusted-app-id" };

const gymScene: Scene = {
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
};

function mockRepo(overrides?: Partial<SceneRepository>): SceneRepository {
  return {
    findCustomByIdentity: async () => [],
    create: async () => gymScene,
    findById: async () => undefined,
    update: async () => ({ status: "not_found" }),
    delete: async () => ({ status: "not_found" }),
    ...overrides,
  };
}

test("有效的自定义场景创建返回成功信封", async () => {
  let createdInput: unknown;
  let createdIdentity: unknown;
  const repository = mockRepo({
    create: async (input, id) => {
      createdInput = input;
      createdIdentity = id;
      return gymScene;
    },
  });

  const response = await createScene(
    {
      name: "健身房",
      category: "custom",
      estimatedTemperatureCelsius: 24,
      feel: "stuffy",
      note: "运动时偏热",
    },
    identity,
    repository,
    "req_create",
  );

  assert.deepEqual(createdInput, {
    name: "健身房",
    category: "custom",
    estimatedTemperatureCelsius: 24,
    feel: "stuffy",
    note: "运动时偏热",
  });
  assert.deepEqual(createdIdentity, identity);
  assert.deepEqual(response, { data: gymScene, requestId: "req_create" });
});

test("场景名称为空、无效类别或超界温度返回校验错误", async () => {
  const repository = mockRepo();

  const emptyName = await createScene(
    {
      name: "",
      category: "home",
      estimatedTemperatureCelsius: 25,
      feel: "comfortable",
    },
    identity,
    repository,
    "req_empty",
  );
  assert.equal(
    "error" in emptyName && (emptyName.error as Record<string, unknown>).code,
    "VALIDATION_ERROR",
  );

  const badCategory = await createScene(
    {
      name: "测试",
      category: "unknown" as Scene["category"],
      estimatedTemperatureCelsius: 25,
      feel: "comfortable",
    },
    identity,
    repository,
    "req_bad",
  );
  assert.equal(
    "error" in badCategory &&
      (badCategory.error as Record<string, unknown>).code,
    "VALIDATION_ERROR",
  );
});

test("仓储创建失败返回友好可重试错误", async () => {
  const repository = mockRepo({
    create: async () => {
      throw new Error("database error");
    },
  });

  const response = await createScene(
    {
      name: "健身房",
      category: "custom",
      estimatedTemperatureCelsius: 24,
      feel: "stuffy",
    },
    identity,
    repository,
    "req_error",
  );

  assert.deepEqual(response, {
    error: {
      code: "INTERNAL_ERROR",
      message: "场景添加失败，请稍后重试",
      retryable: true,
    },
    requestId: "req_error",
  });
});

test("更新已存在的自定义场景返回成功信封", async () => {
  const updatedGym: Scene = { ...gymScene, name: "家庭健身房", version: 2 };
  let updatedId: unknown;
  const repository = mockRepo({
    findById: async () => gymScene,
    update: async (id) => {
      updatedId = id;
      return { status: "updated", scene: updatedGym };
    },
  });

  const response = await updateScene(
    "scene_gym",
    {
      name: "家庭健身房",
      category: "custom",
      estimatedTemperatureCelsius: 24,
      feel: "stuffy",
      expectedVersion: 1,
    },
    identity,
    repository,
    "req_update",
  );

  assert.equal(updatedId, "scene_gym");
  assert.deepEqual(response, { data: updatedGym, requestId: "req_update" });
});

test("更新不存在的场景返回 NOT_FOUND", async () => {
  const repository = mockRepo();

  const response = await updateScene(
    "scene_unknown",
    {
      name: "不存在",
      category: "home",
      estimatedTemperatureCelsius: 22,
      feel: "cold",
      expectedVersion: 1,
    },
    identity,
    repository,
    "req_notfound",
  );

  assert.deepEqual(response, {
    error: {
      code: "NOT_FOUND",
      message: "场景不存在或已删除",
      retryable: false,
    },
    requestId: "req_notfound",
  });
});

test("版本冲突返回 CONFLICT", async () => {
  const repository = mockRepo({
    findById: async () => gymScene,
    update: async () => ({ status: "conflict" }),
  });

  const response = await updateScene(
    "scene_gym",
    {
      name: "健身房改",
      category: "custom",
      estimatedTemperatureCelsius: 24,
      feel: "stuffy",
      expectedVersion: 1,
    },
    identity,
    repository,
    "req_conflict",
  );

  assert.deepEqual(response, {
    error: {
      code: "CONFLICT",
      message: "场景已被修改，请刷新后重试",
      retryable: true,
    },
    requestId: "req_conflict",
  });
});
