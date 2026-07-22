import assert from "node:assert/strict";
import test from "node:test";
import { createItinerary, updateItinerary } from "./manage-itineraries.ts";
import type { ItineraryRepository } from "./repository.ts";
import type { Itinerary } from "../../../../packages/contracts/src/index.ts";

const identity = { openId: "o", appId: "a" };
const item: Itinerary = {
  id: "iti_001",
  startTime: "09:00",
  sceneId: "s1",
  sceneName: "办公室",
  sceneCategory: "office",
  estimatedTemperatureCelsius: 22,
  durationMinutes: 480,
  createdAt: "2026-07-21T00:00:00.000Z",
  updatedAt: "2026-07-21T00:00:00.000Z",
  version: 1,
};

function mock(overrides?: Partial<ItineraryRepository>): ItineraryRepository {
  return {
    findByDate: async () => [],
    create: async () => item,
    findById: async () => undefined,
    update: async () => ({ status: "not_found" }),
    delete: async () => ({ status: "not_found" }),
    ...overrides,
  };
}

test("创建行程返回成功信封", async () => {
  const repo = mock({ create: async () => item });
  const r = await createItinerary(
    {
      startTime: "09:00",
      sceneId: "s1",
      sceneName: "办公室",
      sceneCategory: "office",
      estimatedTemperatureCelsius: 22,
      durationMinutes: 480,
    },
    identity,
    repo,
    "r1",
  );
  assert.deepEqual(r, { data: item, requestId: "r1" });
});

test("创建缺少字段返回校验错误", async () => {
  const r = await createItinerary({ startTime: "" }, identity, mock(), "r2");
  assert.equal(
    "error" in r && (r.error as Record<string, unknown>).code,
    "VALIDATION_ERROR",
  );
});

test("更新已有行程返回成功", async () => {
  const updated = { ...item, startTime: "10:00", version: 2 };
  const repo = mock({
    findById: async () => item,
    update: async () => ({ status: "updated", itinerary: updated }),
  });
  const r = await updateItinerary(
    "iti_001",
    {
      startTime: "10:00",
      sceneId: "s1",
      sceneName: "办公室",
      sceneCategory: "office",
      estimatedTemperatureCelsius: 22,
      durationMinutes: 480,
      expectedVersion: 1,
    },
    identity,
    repo,
    "r3",
  );
  assert.deepEqual(r, { data: updated, requestId: "r3" });
});

test("更新不存在的行程返回 NOT_FOUND", async () => {
  const r = await updateItinerary(
    "iti_x",
    {
      startTime: "09:00",
      sceneId: "s1",
      sceneName: "x",
      sceneCategory: "office",
      estimatedTemperatureCelsius: 22,
      durationMinutes: 60,
      expectedVersion: 1,
    },
    identity,
    mock(),
    "r4",
  );
  assert.deepEqual(r, {
    error: {
      code: "NOT_FOUND",
      message: "行程不存在或已删除",
      retryable: false,
    },
    requestId: "r4",
  });
});
