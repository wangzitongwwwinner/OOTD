import assert from "node:assert/strict";
import test from "node:test";

import { generateGenericRecommendation } from "./generic-recommendation.ts";

test("游客无需定位和用户资料即可生成通用建议并保留可续接快照", async () => {
  let received: unknown;
  let recorded: unknown;
  const response = await generateGenericRecommendation(
    {
      generateRecommendation: async (input) => {
        received = input;
        return {
          summary: "通用分层穿搭",
          layers: [{ type: "base", description: "透气内搭" }],
          tips: ["根据体感增减衣物"],
          source: "llm",
        };
      },
    },
    "req_generic",
    { openId: "guest-openid", appId: "appid" },
    {
      markFirstSuccess: async () => undefined,
      recordRecommendation: async (identity, input) => {
        recorded = { identity, input };
      },
    },
    () => new Date("2026-08-01T05:00:00.000Z"),
  );

  assert.equal("data" in response && response.data.source, "llm");
  assert.deepEqual(recorded, {
    identity: { openId: "guest-openid", appId: "appid" },
    input: {
      recommendationId: "req_generic",
      source: "llm",
      createdAt: "2026-08-01T05:00:00.000Z",
    },
  });
  assert.deepEqual(received, {
    outdoorHighCelsius: 26,
    outdoorLowCelsius: 18,
    outdoorCondition: "通用天气",
    itineraries: [
      { sceneName: "通勤", temperatureCelsius: 22, durationMinutes: 60 },
      { sceneName: "办公室", temperatureCelsius: 24, durationMinutes: 480 },
    ],
    feelPreference: "comfortable",
  });
});
