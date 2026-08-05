import assert from "node:assert/strict";
import test from "node:test";
import type { Db } from "@cloudbase/database";

import { CloudBaseFeedbackRepository } from "./cloudbase-feedback-repository.ts";

test("登录后可将同一微信身份的游客建议快照续接给用户", async () => {
  const snapshotUpdates: unknown[] = [];
  const feedbackWrites: unknown[] = [];
  const database = {
    collection(name: string) {
      return {
        where(query: Record<string, unknown>) {
          return {
            limit() {
              return {
                async get() {
                  if (name === "users") return { data: [{ id: "user_1" }] };
                  if (name === "recommendationSnapshots") {
                    if (query.userId === "user_1") return { data: [] };
                    if (
                      query.guestOpenId === "guest-openid" &&
                      query.guestAppId === "appid"
                    )
                      return { data: [{ recommendationId: "rec-guest" }] };
                  }
                  return { data: [] };
                },
              };
            },
          };
        },
        doc() {
          return {
            async update(value: unknown) {
              snapshotUpdates.push(value);
            },
            async set(value: unknown) {
              feedbackWrites.push(value);
            },
          };
        },
      };
    },
  } as unknown as Db;

  const result = await new CloudBaseFeedbackRepository(database).upsert({
    identity: { openId: "guest-openid", appId: "appid" },
    recommendationId: "rec-guest",
    rating: "helpful",
    now: "2026-08-01T05:01:00.000Z",
  });

  assert.equal(result.status, "saved");
  assert.deepEqual(snapshotUpdates, [{ userId: "user_1" }]);
  assert.equal(feedbackWrites.length, 1);
});
