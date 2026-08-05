import type { TrustedIdentity } from "../context.ts";

export type FirstSuccessMarker =
  | "firstSceneEditedAt"
  | "firstItinerarySavedAt"
  | "firstFeelPreferenceModifiedAt";

export interface MetricsRecorder {
  markFirstSuccess(
    identity: TrustedIdentity,
    marker: FirstSuccessMarker,
    occurredAt: string,
  ): Promise<void>;
  recordRecommendation(
    identity: TrustedIdentity,
    input: {
      recommendationId: string;
      source: "llm" | "rules";
      createdAt: string;
    },
  ): Promise<void>;
}
