import { readFile } from "node:fs/promises";

import {
  calculateMvpMetrics,
  type MetricUser,
  type RecommendationFeedback,
  type RecommendationSnapshot,
} from "../src/metrics/calculate-metrics.ts";
import {
  renderMetricCsv,
  renderMetricMarkdown,
} from "../src/metrics/render-metric-report.ts";

interface MetricExport {
  users: MetricUser[];
  recommendations: RecommendationSnapshot[];
  feedbacks?: RecommendationFeedback[];
}

async function main() {
  const [inputPath, format = "markdown", cutoffAt = new Date().toISOString()] =
    process.argv.slice(2);
  if (!inputPath || !["markdown", "csv"].includes(format)) {
    throw new Error(
      "Usage: npm run report:metrics -- <export.json> [markdown|csv] [cutoff ISO]",
    );
  }

  const input = JSON.parse(await readFile(inputPath, "utf8")) as MetricExport;
  const report = calculateMvpMetrics({
    cutoffAt,
    users: input.users,
    recommendations: input.recommendations,
    feedbacks: input.feedbacks ?? [],
  });
  process.stdout.write(
    format === "csv"
      ? renderMetricCsv(report)
      : renderMetricMarkdown(report),
  );
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
