import assert from "node:assert/strict";
import test from "node:test";

import type { MvpMetricReport } from "./calculate-metrics.ts";
import {
  renderMetricCsv,
  renderMetricMarkdown,
} from "./render-metric-report.ts";

const report: MvpMetricReport = {
  cutoffAt: "2026-07-26T00:00:00.000Z",
  definitionVersion: "mvp-2026-07-29",
  totalUsers: 2,
  metrics: {
    recommendationUsage: { numerator: 1, denominator: 2 },
    recommendationReuse7d: { numerator: 0, denominator: 0 },
    sceneEdit: { numerator: 1, denominator: 2 },
    itinerarySave: { numerator: 2, denominator: 2 },
    feelPreferenceModify: { numerator: 0, denominator: 2 },
    recommendationHelpful: { numerator: 1, denominator: 2 },
    recommendationPositive: { numerator: 2, denominator: 2 },
    recommendationFeedbackCoverage: { numerator: 2, denominator: 3 },
  },
};

test("Markdown report renders percentages, zero denominators, and feedback metrics", () => {
  const output = renderMetricMarkdown(report);

  assert.match(output, /AI 推荐用户使用率 \| 1 \/ 2 \| 50\.0%/);
  assert.match(output, /AI 推荐 7 日复用率 \| — \| —/);
  assert.match(output, /AI 建议有用率 \| 1 \/ 2 \| 50\.0% \| 可用/);
  assert.match(output, /AI 建议正向反馈率 \| 2 \/ 2 \| 100\.0% \| 可用/);
  assert.match(output, /AI 建议评价覆盖率 \| 2 \/ 3 \| 66\.7% \| 可用/);
  assert.match(output, /数据截至：2026-07-26T00:00:00\.000Z/);
  assert.match(output, /口径版本：mvp-2026-07-29/);
});

test("CSV report includes the same values and report metadata", () => {
  const output = renderMetricCsv(report);

  assert.match(
    output,
    /AI 推荐用户使用率,50\.0%,1,2,可用,2026-07-26T00:00:00\.000Z,mvp-2026-07-29/,
  );
  assert.match(
    output,
    /AI 推荐 7 日复用率,—,—,—,无完整观察窗口,2026-07-26T00:00:00\.000Z,mvp-2026-07-29/,
  );
  assert.match(
    output,
    /AI 建议有用率,50\.0%,1,2,可用,2026-07-26T00:00:00\.000Z,mvp-2026-07-29/,
  );
});
