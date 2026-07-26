import type {
  MetricFraction,
  MvpMetricReport,
} from "./calculate-metrics.ts";

interface ReportRow {
  name: string;
  fraction?: MetricFraction;
  unavailable?: boolean;
}

function rows(report: MvpMetricReport): ReportRow[] {
  return [
    { name: "AI 推荐用户使用率", fraction: report.metrics.recommendationUsage },
    { name: "AI 推荐 7 日复用率", fraction: report.metrics.recommendationReuse7d },
    { name: "场景编辑完成率", fraction: report.metrics.sceneEdit },
    { name: "行程保存完成率", fraction: report.metrics.itinerarySave },
    { name: "体感偏好修改率", fraction: report.metrics.feelPreferenceModify },
    { name: "AI 建议有用率", unavailable: true },
    { name: "AI 建议正向反馈率", unavailable: true },
    { name: "AI 建议评价覆盖率", unavailable: true },
  ];
}

function display(row: ReportRow): {
  value: string;
  numerator: string;
  denominator: string;
  fraction: string;
  status: string;
} {
  if (row.unavailable) {
    return {
      value: "—",
      numerator: "—",
      denominator: "—",
      fraction: "—",
      status: "暂不可用（M10-01）",
    };
  }

  const fraction = row.fraction!;
  if (fraction.denominator === 0) {
    return {
      value: "—",
      numerator: "—",
      denominator: "—",
      fraction: "—",
      status: "无完整观察窗口",
    };
  }

  return {
    value: `${((fraction.numerator / fraction.denominator) * 100).toFixed(1)}%`,
    numerator: String(fraction.numerator),
    denominator: String(fraction.denominator),
    fraction: `${fraction.numerator} / ${fraction.denominator}`,
    status: "可用",
  };
}

function csvCell(value: string): string {
  if (!/[",\r\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

export function renderMetricMarkdown(report: MvpMetricReport): string {
  const body = rows(report)
    .map((row) => {
      const value = display(row);
      return `| ${row.name} | ${value.fraction} | ${value.value} | ${value.status} |`;
    })
    .join("\n");

  return [
    "# MVP 指标报告",
    "",
    `- 数据截至：${report.cutoffAt}`,
    `- 口径版本：${report.definitionVersion}`,
    `- 有效用户数：${report.totalUsers}`,
    "",
    "| 指标 | 分子 / 分母 | 当前值 | 状态 |",
    "| --- | ---: | ---: | --- |",
    body,
    "",
    "> 说明：业务数据删除可能造成历史数据低估；报告不包含任何用户身份信息。",
    "",
  ].join("\n");
}

export function renderMetricCsv(report: MvpMetricReport): string {
  const header =
    "metric,value,numerator,denominator,status,cutoffAt,definitionVersion";
  const body = rows(report).map((row) => {
    const value = display(row);
    return [
      row.name,
      value.value,
      value.numerator,
      value.denominator,
      value.status,
      report.cutoffAt,
      report.definitionVersion,
    ]
      .map(csvCell)
      .join(",");
  });
  return [header, ...body, ""].join("\n");
}
