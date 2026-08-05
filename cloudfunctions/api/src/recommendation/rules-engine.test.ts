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
  assert.ok(r.layers.some((l) => l.type === "upper"));
  assert.ok(r.layers.some((l) => l.type === "lower"));
  assert.ok(r.layers.some((l) => l.type === "mid"));
  assert.ok(r.layers.some((l) => l.type === "outer"));
  assert.ok(r.layers.some((l) => l.description.includes("羽绒")));
  assert.equal(r.source, "rules");
});

test("凉爽天气温差大时建议方便穿脱", () => {
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

test("夏季建议包含上身和下身且偏冷体感最多增加薄外套", () => {
  const r = generateRulesRecommendation({
    outdoorHighCelsius: 34,
    outdoorLowCelsius: 26,
    outdoorCondition: "晴",
    itineraries: [{ sceneName: "办公室", temperatureCelsius: 22 }],
    feelPreference: "cold",
  });
  assert.ok(r.layers.some((l) => l.type === "upper"));
  assert.ok(r.layers.some((l) => l.type === "lower"));
  assert.ok(
    r.layers
      .filter((l) => l.type === "outer")
      .every((l) => l.description.includes("薄")),
  );
  assert.ok(
    r.layers.every((l) => !/风衣|夹克|围巾|毛衣|抓绒|羽绒/.test(l.description)),
  );
  assert.ok(r.tips.every((tip) => !tip.includes("洋葱式")));
});

test("夏季雨天补充鞋履建议而不强制增加防水外套", () => {
  const r = generateRulesRecommendation({
    outdoorHighCelsius: 32,
    outdoorLowCelsius: 25,
    outdoorCondition: "中到大雨",
    itineraries: [],
    feelPreference: "comfortable",
  });
  assert.ok(r.layers.some((l) => l.type === "footwear"));
  assert.ok(r.layers.some((l) => l.description.includes("防滑")));
  assert.ok(r.layers.every((l) => l.type !== "outer"));
  assert.ok(r.tips.some((t) => t.includes("雨具")));
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
  assert.ok(r.tips.every((tip) => !tip.includes("你")));
  assert.ok(r.tips.some((tip) => tip.includes("您")));
});
