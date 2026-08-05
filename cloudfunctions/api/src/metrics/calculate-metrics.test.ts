import assert from "node:assert/strict";
import test from "node:test";

import { calculateMvpMetrics } from "./calculate-metrics.ts";

test("排除测试用户并按七日完整窗口计算非评价指标", () => {
  const report = calculateMvpMetrics({
    cutoffAt: "2026-07-26T00:00:00.000Z",
    users: [
      {
        id: "u1",
        createdAt: "2026-07-01T00:00:00.000Z",
        firstSceneEditedAt: "2026-07-02T00:00:00.000Z",
        firstItinerarySavedAt: "2026-07-03T00:00:00.000Z",
      },
      {
        id: "u2",
        createdAt: "2026-07-02T00:00:00.000Z",
        firstFeelPreferenceModifiedAt: "2026-07-04T00:00:00.000Z",
      },
      { id: "test", createdAt: "2026-07-01T00:00:00.000Z", isTestUser: true },
    ],
    recommendations: [
      { recommendationId: "r1", userId: "u1", createdAt: "2026-07-10T00:00:00.000Z" },
      { recommendationId: "r1", userId: "u1", createdAt: "2026-07-10T00:00:00.000Z" },
      { recommendationId: "r2", userId: "u1", createdAt: "2026-07-17T00:00:00.000Z" },
      { recommendationId: "rt", userId: "test", createdAt: "2026-07-10T00:00:00.000Z" },
    ],
  });

  assert.equal(report.totalUsers, 2);
  assert.deepEqual(report.metrics.recommendationUsage, { numerator: 1, denominator: 2 });
  assert.deepEqual(report.metrics.recommendationReuse7d, { numerator: 1, denominator: 1 });
  assert.deepEqual(report.metrics.sceneEdit, { numerator: 1, denominator: 2 });
  assert.deepEqual(report.metrics.itinerarySave, { numerator: 1, denominator: 2 });
  assert.deepEqual(report.metrics.feelPreferenceModify, { numerator: 1, denominator: 2 });
});

test("没有完整观察窗口时七日复用率分母为零", () => {
  const report = calculateMvpMetrics({
    cutoffAt: "2026-07-26T00:00:00.000Z",
    users: [{ id: "u1", createdAt: "2026-07-25T00:00:00.000Z" }],
    recommendations: [
      { recommendationId: "r1", userId: "u1", createdAt: "2026-07-25T00:00:00.000Z" },
    ],
  });
  assert.deepEqual(report.metrics.recommendationReuse7d, {
    numerator: 0,
    denominator: 0,
  });
});

test("评价按用户和建议去重，并排除测试用户、未知建议与截止时间后的修改", () => {
  const report = calculateMvpMetrics({
    cutoffAt: "2026-07-29T00:00:00.000Z",
    users: [
      { id: "u1", createdAt: "2026-07-01T00:00:00.000Z" },
      { id: "u2", createdAt: "2026-07-01T00:00:00.000Z" },
      { id: "test", createdAt: "2026-07-01T00:00:00.000Z", isTestUser: true },
    ],
    recommendations: [
      { recommendationId: "r1", userId: "u1", createdAt: "2026-07-20T00:00:00.000Z" },
      { recommendationId: "r2", userId: "u1", createdAt: "2026-07-21T00:00:00.000Z" },
      { recommendationId: "r3", userId: "u2", createdAt: "2026-07-22T00:00:00.000Z" },
      { recommendationId: "rt", userId: "test", createdAt: "2026-07-22T00:00:00.000Z" },
    ],
    feedbacks: [
      {
        recommendationId: "r1",
        userId: "u1",
        rating: "unhelpful",
        updatedAt: "2026-07-23T00:00:00.000Z",
      },
      {
        recommendationId: "r1",
        userId: "u1",
        rating: "helpful",
        updatedAt: "2026-07-24T00:00:00.000Z",
      },
      {
        recommendationId: "r2",
        userId: "u1",
        rating: "neutral",
        updatedAt: "2026-07-24T00:00:00.000Z",
      },
      {
        recommendationId: "missing",
        userId: "u1",
        rating: "helpful",
        updatedAt: "2026-07-24T00:00:00.000Z",
      },
      {
        recommendationId: "rt",
        userId: "test",
        rating: "helpful",
        updatedAt: "2026-07-24T00:00:00.000Z",
      },
      {
        recommendationId: "r3",
        userId: "u2",
        rating: "helpful",
        updatedAt: "2026-07-30T00:00:00.000Z",
      },
    ],
  });

  assert.deepEqual(report.metrics.recommendationHelpful, {
    numerator: 1,
    denominator: 2,
  });
  assert.deepEqual(report.metrics.recommendationPositive, {
    numerator: 2,
    denominator: 2,
  });
  assert.deepEqual(report.metrics.recommendationFeedbackCoverage, {
    numerator: 2,
    denominator: 3,
  });
});

test("没有建议或有效评价时三项评价指标保持零分母语义", () => {
  const report = calculateMvpMetrics({
    cutoffAt: "2026-07-29T00:00:00.000Z",
    users: [{ id: "u1", createdAt: "2026-07-01T00:00:00.000Z" }],
    recommendations: [],
    feedbacks: [],
  });

  assert.deepEqual(report.metrics.recommendationHelpful, {
    numerator: 0,
    denominator: 0,
  });
  assert.deepEqual(report.metrics.recommendationPositive, {
    numerator: 0,
    denominator: 0,
  });
  assert.deepEqual(report.metrics.recommendationFeedbackCoverage, {
    numerator: 0,
    denominator: 0,
  });
});
