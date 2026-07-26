export interface MetricUser {
  id: string;
  createdAt: string;
  isTestUser?: boolean;
  firstSceneEditedAt?: string;
  firstItinerarySavedAt?: string;
  firstFeelPreferenceModifiedAt?: string;
}

export interface RecommendationSnapshot {
  recommendationId: string;
  userId: string;
  createdAt: string;
}

export interface MetricFraction {
  numerator: number;
  denominator: number;
}

export interface MvpMetricReport {
  cutoffAt: string;
  definitionVersion: "mvp-2026-07-26";
  totalUsers: number;
  metrics: {
    recommendationUsage: MetricFraction;
    recommendationReuse7d: MetricFraction;
    sceneEdit: MetricFraction;
    itinerarySave: MetricFraction;
    feelPreferenceModify: MetricFraction;
  };
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function calculateMvpMetrics(input: {
  cutoffAt: string;
  users: MetricUser[];
  recommendations: RecommendationSnapshot[];
}): MvpMetricReport {
  const cutoff = Date.parse(input.cutoffAt);
  if (!Number.isFinite(cutoff)) throw new Error("Invalid cutoffAt");

  const users = Array.from(
    new Map(
      input.users
        .filter((user) => !user.isTestUser && Date.parse(user.createdAt) <= cutoff)
        .map((user) => [user.id, user]),
    ).values(),
  );
  const userIds = new Set(users.map((user) => user.id));
  const recommendations = Array.from(
    new Map(
      input.recommendations
        .filter(
          (item) =>
            userIds.has(item.userId) && Date.parse(item.createdAt) <= cutoff,
        )
        .map((item) => [item.recommendationId, item]),
    ).values(),
  );
  const recommendationsByUser = new Map<string, RecommendationSnapshot[]>();
  for (const item of recommendations) {
    const current = recommendationsByUser.get(item.userId) ?? [];
    current.push(item);
    recommendationsByUser.set(item.userId, current);
  }
  for (const items of recommendationsByUser.values()) {
    items.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  }

  const totalUsers = users.length;
  let reuseDenominator = 0;
  let reuseNumerator = 0;
  for (const items of recommendationsByUser.values()) {
    const firstAt = Date.parse(items[0]!.createdAt);
    if (firstAt + SEVEN_DAYS_MS > cutoff) continue;
    reuseDenominator += 1;
    if (
      items.slice(1).some((item) => {
        const at = Date.parse(item.createdAt);
        return at > firstAt && at <= firstAt + SEVEN_DAYS_MS;
      })
    ) {
      reuseNumerator += 1;
    }
  }

  const fraction = (numerator: number): MetricFraction => ({
    numerator,
    denominator: totalUsers,
  });
  return {
    cutoffAt: input.cutoffAt,
    definitionVersion: "mvp-2026-07-26",
    totalUsers,
    metrics: {
      recommendationUsage: fraction(recommendationsByUser.size),
      recommendationReuse7d: {
        numerator: reuseNumerator,
        denominator: reuseDenominator,
      },
      sceneEdit: fraction(
        users.filter((user) => user.firstSceneEditedAt !== undefined).length,
      ),
      itinerarySave: fraction(
        users.filter((user) => user.firstItinerarySavedAt !== undefined).length,
      ),
      feelPreferenceModify: fraction(
        users.filter(
          (user) => user.firstFeelPreferenceModifiedAt !== undefined,
        ).length,
      ),
    },
  };
}
