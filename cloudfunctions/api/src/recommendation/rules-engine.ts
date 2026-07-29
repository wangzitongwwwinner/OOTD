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
  const isSummer =
    input.outdoorHighCelsius >= 28 || input.outdoorLowCelsius >= 24;

  const layers: RecommendationLayer[] = [];
  const tips: string[] = [];

  if (isSummer) {
    layers.push({ type: "upper", description: "透气短袖 T 恤或短袖衬衫" });
    layers.push({ type: "lower", description: "轻薄长裤或宽松短裤" });
    if (input.feelPreference === "cold" || minTemp < 24) {
      layers.push({ type: "outer", description: "一件轻薄开衫或薄外套" });
    }
  } else {
    if (minTemp < 10) {
      layers.push({ type: "upper", description: "保暖内衣和长袖上衣" });
      layers.push({ type: "lower", description: "保暖长裤" });
    } else if (minTemp < 18) {
      layers.push({ type: "upper", description: "薄款长袖上衣" });
      layers.push({ type: "lower", description: "长裤" });
    } else {
      layers.push({ type: "upper", description: "短袖 T 恤或薄长袖" });
      layers.push({ type: "lower", description: "轻薄长裤" });
    }

    if (minTemp < 5) {
      layers.push({ type: "mid", description: "厚款毛衣或抓绒卫衣" });
    } else if (minTemp < 15) {
      layers.push({ type: "mid", description: "薄款毛衣或棉质卫衣" });
    }

    if (minTemp < 0) {
      layers.push({ type: "outer", description: "厚羽绒服或棉大衣" });
    } else if (minTemp < 8) {
      layers.push({ type: "outer", description: "薄羽绒服或夹棉外套" });
    } else if (minTemp < 15 || range > 10) {
      layers.push({ type: "outer", description: "普通外套" });
    }
  }

  if (input.feelPreference === "cold" && !isSummer) {
    tips.push("您容易觉得冷，如果仍感到凉，可以多加一件薄外套");
  } else if (input.feelPreference === "stuffy") {
    tips.push("您容易觉得闷热，建议优先选择透气材质");
  }

  if (range > 15) {
    tips.push("全天温差较大，外套选方便穿脱的即可");
  }
  if (range > 10 && layers.some((l) => l.type === "outer")) {
    tips.push("进入室内场景后可脱下外层，避免温差不适");
  }

  // Weather condition tips
  if (input.outdoorCondition.includes("雨")) {
    tips.push("今日有雨，记得携带雨具");
    layers.push({
      type: "footwear",
      description: "防滑、耐水且容易清理的鞋",
    });
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
