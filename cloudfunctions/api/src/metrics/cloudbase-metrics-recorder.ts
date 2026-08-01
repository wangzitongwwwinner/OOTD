import type { Db } from "@cloudbase/database";

import type { TrustedIdentity } from "../context.ts";
import type {
  FirstSuccessMarker,
  MetricsRecorder,
} from "./metrics-recorder.ts";

interface StoredUser {
  _id?: string;
  id: string;
  [key: string]: unknown;
}

export class CloudBaseMetricsRecorder implements MetricsRecorder {
  constructor(private readonly database: Db) {}

  async markFirstSuccess(
    identity: TrustedIdentity,
    marker: FirstSuccessMarker,
    occurredAt: string,
  ): Promise<void> {
    const users = this.database.collection("users");
    const result = await users
      .where({ wechatOpenId: identity.openId, wechatAppId: identity.appId })
      .limit(1)
      .get();
    const user = result.data[0] as StoredUser | undefined;
    if (!user || typeof user[marker] === "string") return;

    await users
      .where({
        _id: user._id,
        [marker]: this.database.command.exists(false),
      })
      .update({ [marker]: occurredAt });
  }

  async recordRecommendation(
    identity: TrustedIdentity,
    input: {
      recommendationId: string;
      source: "llm" | "rules";
      createdAt: string;
    },
  ): Promise<void> {
    const userResult = await this.database
      .collection("users")
      .where({ wechatOpenId: identity.openId, wechatAppId: identity.appId })
      .limit(1)
      .get();
    const user = userResult.data[0] as StoredUser | undefined;
    const owner = user
      ? { userId: user.id }
      : {
          guestOpenId: identity.openId,
          guestAppId: identity.appId,
        };

    await this.database
      .collection("recommendationSnapshots")
      .doc(input.recommendationId)
      .set({
        recommendationId: input.recommendationId,
        ...owner,
        source: input.source,
        createdAt: input.createdAt,
      });
  }
}

export async function recordMetricSafely(
  action: () => Promise<void>,
): Promise<void> {
  try {
    await action();
  } catch (error) {
    console.error(
      "metric recording failed:",
      error instanceof Error ? error.message : String(error),
    );
  }
}
