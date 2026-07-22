import assert from "node:assert/strict";
import test from "node:test";
import { generateRecommendation } from "./generate-recommendation.ts";
import type { LlmProvider } from "./llm-provider.ts";

test("无 LLM 时使用规则引擎", async () => {
  const r = await generateRecommendation(
    {
      outdoorHighCelsius: 28,
      outdoorLowCelsius: 18,
      outdoorCondition: "晴",
      itineraries: [],
      feelPreference: "comfortable",
    },
    undefined,
    "r1",
  );
  assert.equal(
    "data" in r && r.data && (r.data as Record<string, unknown>).source,
    "rules",
  );
});

test("LLM 失败时降级到规则引擎", async () => {
  const badLlm: LlmProvider = {
    generateRecommendation: async () => {
      throw new Error("fail");
    },
  };
  const r = await generateRecommendation(
    {
      outdoorHighCelsius: 28,
      outdoorLowCelsius: 18,
      outdoorCondition: "晴",
      itineraries: [],
      feelPreference: "comfortable",
    },
    badLlm,
    "r2",
  );
  assert.equal(
    "data" in r && r.data && (r.data as Record<string, unknown>).source,
    "rules",
  );
});

test("LLM 成功返回结构化建议", async () => {
  const goodLlm: LlmProvider = {
    generateRecommendation: async () => ({
      summary: "建议穿着",
      layers: [{ type: "base", description: "T恤" }],
      tips: [],
      source: "llm",
    }),
  };
  const r = await generateRecommendation(
    {
      outdoorHighCelsius: 28,
      outdoorLowCelsius: 18,
      outdoorCondition: "晴",
      itineraries: [],
      feelPreference: "comfortable",
    },
    goodLlm,
    "r3",
  );
  assert.equal(
    "data" in r && r.data && (r.data as Record<string, unknown>).source,
    "llm",
  );
  assert.equal(
    "data" in r && r.data && (r.data as Record<string, unknown>).summary,
    "建议穿着",
  );
});
