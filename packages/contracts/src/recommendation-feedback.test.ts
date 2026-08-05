import assert from "node:assert/strict";
import test from "node:test";

import {
  recommendationFeedbackRequestSchema,
  recommendationRatingSchema,
} from "./recommendation-feedback.ts";

test("建议评价只接受三个已知枚举", () => {
  assert.equal(recommendationRatingSchema.safeParse("helpful").success, true);
  assert.equal(recommendationRatingSchema.safeParse("neutral").success, true);
  assert.equal(recommendationRatingSchema.safeParse("unhelpful").success, true);
  assert.equal(recommendationRatingSchema.safeParse("other").success, false);
});

test("建议评价拒绝客户端身份和额外字段", () => {
  assert.equal(
    recommendationFeedbackRequestSchema.safeParse({
      rating: "helpful",
      userId: "spoofed",
    }).success,
    false,
  );
});
