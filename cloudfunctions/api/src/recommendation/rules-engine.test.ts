import assert from "node:assert/strict";
import test from "node:test";
import { generateRulesRecommendation } from "./rules-engine.ts";

test("严寒天气推荐多层保暖", () => {
  const r = generateRulesRecommendation({
    outdoorHighCelsius: -2,
    outdoorLowCelsius: -10,
    outdoorCondition: "晴",
    itineraries: [{ sceneName: "办公室", temperatureCelsius: 22 }],
    feelPreference: "comfortable",
  });
  assert.ok(r.summary.length > 0);
  assert.ok(r.layers.some((l) => l.type === "base"));
  assert.ok(r.layers.some((l) => l.type === "mid"));
  assert.ok(r.layers.some((l) => l.type === "outer"));
  assert.ok(r.layers.some((l) => l.description.includes("羽绒")));
  assert.equal(r.source, "rules");
});

test("凉爽天气温差大时推荐洋葱穿法", () => {
  const r = generateRulesRecommendation({
    outdoorHighCelsius: 20,
    outdoorLowCelsius: 5,
    outdoorCondition: "多云",
    itineraries: [
      { sceneName: "地铁通勤", temperatureCelsius: 26 },
      { sceneName: "办公室", temperatureCelsius: 22 },
    ],
    feelPreference: "comfortable",
  });
  assert.ok(r.tips.some((t) => t.includes("温差")));
  assert.ok(r.layers.some((l) => l.type === "outer"));
});

test("炎热天气仅需轻薄穿着", () => {
  const r = generateRulesRecommendation({
    outdoorHighCelsius: 36,
    outdoorLowCelsius: 28,
    outdoorCondition: "晴",
    itineraries: [],
    feelPreference: "stuffy",
  });
  assert.ok(r.layers.every((l) => l.type !== "outer"));
  assert.ok(r.tips.some((t) => t.includes("透气") || t.includes("防晒")));
});

test("雨天自动添加防水外套", () => {
  const r = generateRulesRecommendation({
    outdoorHighCelsius: 26,
    outdoorLowCelsius: 22,
    outdoorCondition: "中到大雨",
    itineraries: [],
    feelPreference: "comfortable",
  });
  assert.ok(r.layers.some((l) => l.description.includes("防水")));
  assert.ok(r.tips.some((t) => t.includes("雨具")));
  assert.ok(r.layers.length >= 1);
});

test("偏冷体感偏好额外提示", () => {
  const r = generateRulesRecommendation({
    outdoorHighCelsius: 15,
    outdoorLowCelsius: 8,
    outdoorCondition: "阴",
    itineraries: [],
    feelPreference: "cold",
  });
  assert.ok(r.tips.some((t) => t.includes("容易觉得冷")));
});
