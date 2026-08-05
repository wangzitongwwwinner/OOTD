import assert from "node:assert/strict";
import test from "node:test";
import { deleteItinerary } from "./delete-itinerary.ts";
import type { ItineraryRepository } from "./repository.ts";

const identity = { openId: "o", appId: "a" };
function mock(d?: Partial<ItineraryRepository>): ItineraryRepository {
  return {
    findByDate: async () => [],
    create: async () => {
      throw new Error("x");
    },
    findById: async () => undefined,
    update: async () => ({ status: "not_found" }),
    delete: async () => ({ status: "deleted" }),
    ...d,
  };
}

test("删除成功返回空数据", async () => {
  const r = await deleteItinerary("iti_001", identity, mock(), "r1");
  assert.deepEqual(r, { data: null, requestId: "r1" });
});

test("不存在的行程返回 NOT_FOUND", async () => {
  const r = await deleteItinerary(
    "iti_x",
    identity,
    mock({ delete: async () => ({ status: "not_found" }) }),
    "r2",
  );
  assert.deepEqual(r, {
    error: {
      code: "NOT_FOUND",
      message: "行程不存在或已删除",
      retryable: false,
    },
    requestId: "r2",
  });
});
