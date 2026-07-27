import type { Db } from "@cloudbase/database";

import type { FeedbackRepository } from "./feedback-repository.ts";

export class CloudBaseFeedbackRepository implements FeedbackRepository {
  constructor(private readonly database: Db) {}

  async upsert(
    input: Parameters<FeedbackRepository["upsert"]>[0],
  ): ReturnType<FeedbackRepository["upsert"]> {
    const users = await this.database
      .collection("users")
      .where({
        wechatOpenId: input.identity.openId,
        wechatAppId: input.identity.appId,
      })
      .limit(1)
      .get();
    const user = users.data[0] as { id?: string } | undefined;
    if (!user?.id) return { status: "recommendation_not_found" };

    const snapshots = await this.database
      .collection("recommendationSnapshots")
      .where({
        recommendationId: input.recommendationId,
        userId: user.id,
      })
      .limit(1)
      .get();
    if (!snapshots.data.length) return { status: "recommendation_not_found" };

    const feedback = {
      recommendationId: input.recommendationId,
      rating: input.rating,
      updatedAt: input.now,
    };
    await this.database
      .collection("recommendationFeedbacks")
      .doc(`${user.id}__${input.recommendationId}`)
      .set({
        ...feedback,
        userId: user.id,
        createdAt: input.now,
      });
    return { status: "saved", feedback };
  }
}
