import type {
  Recommendation,
  RecommendationLayer,
} from "../../../../packages/contracts/src/index.ts";

export interface RuleInput {
  outdoorHighCelsius: number;
  outdoorLowCelsius: number;
  outdoorCondition: string;
  itineraries: Array<{ sceneName: string; temperatureCelsius: number }>;
  feelPreference: string; // cold | comfortable | stuffy | cool
}

export function generateRulesRecommendation(input: RuleInput): Recommendation {
  const temps = [
    input.outdoorHighCelsius,
    input.outdoorLowCelsius,
    ...input.itineraries.map((i) => i.temperatureCelsius),
  ];
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const range = maxTemp - minTemp;

  const layers: RecommendationLayer[] = [];
  const tips: string[] = [];

  // Base layer based on minimum temperature
  if (minTemp < 10) {
    layers.push({ type: "base", description: "保暖内衣或高领打底衫" });
  } else if (minTemp < 18) {
    layers.push({ type: "base", description: "薄款长袖 T 恤或打底衫" });
  } else {
    layers.push({ type: "base", description: "短袖 T 恤" });
  }

  // Mid layer
  if (minTemp < 5) {
    layers.push({ type: "mid", description: "厚款毛衣或抓绒卫衣" });
  } else if (minTemp < 15) {
    layers.push({ type: "mid", description: "薄款毛衣或棉质卫衣" });
  } else if (minTemp < 22) {
    layers.push({ type: "mid", description: "衬衫或轻薄长袖" });
  }

  // Outer layer based on maximum temperature and range
  if (minTemp < 0) {
    layers.push({ type: "outer", description: "厚羽绒服或棉大衣" });
  } else if (minTemp < 8) {
    layers.push({ type: "outer", description: "薄羽绒服或夹棉外套" });
  } else if (minTemp < 15 || range > 10) {
    layers.push({ type: "outer", description: "风衣、夹克或薄外套" });
  }

  // Feel preference adjustment
  if (input.feelPreference === "cold") {
    tips.push("你容易觉得冷，可在上述基础上多加一件薄外套");
  } else if (input.feelPreference === "stuffy") {
    tips.push("你容易觉得闷热，优先选择透气材质");
  }

  // Temperature range tips
  if (range > 15) {
    tips.push("全天温差较大，建议采用洋葱式穿法，方便随时穿脱");
  }
  if (range > 10 && layers.some((l) => l.type === "outer")) {
    tips.push("进入室内场景后可脱下外层，避免温差不适");
  }

  // Weather condition tips
  if (input.outdoorCondition.includes("雨")) {
    tips.push("今日有雨，记得携带雨具");
    if (!layers.some((l) => l.type === "outer")) {
      layers.push({ type: "outer", description: "防水外套或轻便雨衣" });
    }
  }
  if (input.outdoorCondition.includes("风") && maxTemp < 20) {
    tips.push("风力较大，建议选择防风面料");
  }

  // UV tips
  if (maxTemp > 28) {
    tips.push("气温较高，注意防晒和补水");
  }

  // Scene transitions
  if (input.itineraries.length > 0) {
    const coldest = input.itineraries.reduce((acc, i) =>
      i.temperatureCelsius < acc.temperatureCelsius ? i : acc,
    );
    const warmest = input.itineraries.reduce((acc, i) =>
      i.temperatureCelsius > acc.temperatureCelsius ? i : acc,
    );
    if (coldest.temperatureCelsius !== warmest.temperatureCelsius) {
      tips.push(
        coldest.sceneName + "偏冷，" + warmest.sceneName + "偏暖，注意调节",
      );
    }
  }

  const summary = buildSummary(layers, maxTemp, range);

  return {
    summary,
    layers: layers.slice(0, 10),
    tips: tips.slice(0, 5),
    source: "rules",
  };
}

function buildSummary(
  layers: RecommendationLayer[],
  high: number,
  range: number,
): string {
  const names = layers.map((l) => l.description).join(" + ");
  if (range > 10) return "建议" + names + "，可根据温度变化灵活调整";
  return "建议穿" + names;
}
