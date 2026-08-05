import assert from "node:assert/strict";
import test from "node:test";

import { saveRecommendationFeedback } from "./manage-feedback.ts";
import type { FeedbackRepository } from "./feedback-repository.ts";

const identity = { openId: "openid", appId: "appid" };

test("评价使用可信身份并允许覆盖同一建议", async () => {
  const calls: Array<Parameters<FeedbackRepository["upsert"]>[0]> = [];
  const repository: FeedbackRepository = {
    async upsert(input) {
      calls.push(input);
      return {
        status: "saved",
        feedback: {
          recommendationId: input.recommendationId,
          rating: input.rating,
          updatedAt: input.now,
        },
      };
    },
  };
  const response = await saveRecommendationFeedback(
    "rec-1",
    { rating: "helpful" },
    identity,
    repository,
    "req-1",
    () => new Date("2026-07-27T08:00:00.000Z"),
  );
  assert.ok("data" in response);
  assert.deepEqual(calls[0]?.identity, identity);
  assert.equal(calls[0]?.rating, "helpful");
});

test("拒绝未知评价和客户端伪造身份", async () => {
  const repository: FeedbackRepository = {
    async upsert() {
      throw new Error("should not run");
    },
  };
  const response = await saveRecommendationFeedback(
    "rec-1",
    { rating: "great", userId: "spoofed" },
    identity,
    repository,
    "req-1",
  );
  assert.ok("error" in response);
  assert.equal(response.error.code, "VALIDATION_ERROR");
});
