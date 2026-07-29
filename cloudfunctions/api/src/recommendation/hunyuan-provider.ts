import {
  recommendationSchema,
  type Recommendation,
} from "../../../../packages/contracts/src/index.ts";
import type { LlmInput, LlmProvider } from "./llm-provider.ts";

const ENDPOINT = "https://tokenhub.tencentmaas.com/v1/responses";

interface TokenHubOutput {
  type: string;
  role?: string;
  content?: Array<{ type?: string; text?: string }>;
}

export class HunyuanProvider implements LlmProvider {
  constructor(
    private readonly apiKey: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async generateRecommendation(
    input: LlmInput,
    timeoutMs: number,
  ): Promise<Recommendation> {
    const prompt = buildPrompt(input);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await this.fetcher(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-v4-flash",
          instructions:
            "请作为实用的日常穿衣顾问，使用朴实、直接的语言，不使用时尚术语、夸张表达或“洋葱式穿法”等说法。根据用户信息输出穿搭建议 JSON。",
          input: prompt,
          reasoning: { effort: "none" },
          stream: false,
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("LLM HTTP " + res.status);
      const json = (await res.json()) as { output?: TokenHubOutput[] };
      console.log("LLM raw: " + JSON.stringify(json).slice(0, 300));
      const message = json.output?.find(
        (item) => item.type === "message" && item.role === "assistant",
      );
      const text = message?.content?.find(
        (part) => part.type === "output_text",
      )?.text;
      if (!text) throw new Error("LLM empty response");
      const obj = JSON.parse(extractJson(text)) as unknown;
      return recommendationSchema.parse({ ...(obj as object), source: "llm" });
    } finally {
      clearTimeout(timer);
    }
  }
}

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text;
}

function buildPrompt(input: LlmInput): string {
  const scenes = input.itineraries
    .map(
      (i) =>
        i.sceneName +
        "(" +
        i.temperatureCelsius +
        "°C, " +
        i.durationMinutes +
        "分钟)",
    )
    .join("；");
  return (
    '根据以下信息给出符合日常生活的穿衣建议。必须分别包含上身（type="upper"）和下身（type="lower"）建议；雨天还必须包含鞋履（type="footwear"）建议。可按实际需要增加薄外套（type="outer"）或其他层次，但不要为了凑层次增加衣物。同一件衣物不得在上身和外套等不同字段中重复描述。鞋履和配件应使用普通、宽泛的类型描述，不限定为靴子、羊毛袜等具体选择。夏季即使用户体感偏冷，也最多建议随身带一件轻薄开衫或薄外套，不得推荐风衣、夹克、围巾、毛衣、抓绒或羽绒服。体感偏冷表示同等温度下适当多穿一点，不代表按冬季穿着。tips 必须结合行程的实际停留时长，不得把短暂停留描述为长时间。可选建议使用条件语气，例如“如果您确实觉得冷，可以……”，不得写成所有用户都必须执行。所有第二人称必须使用“您”，禁止使用“你”。语言朴实简短，不使用“洋葱式穿法”等术语。只输出 JSON：{"summary":"一句话总结","layers":[{"type":"upper|lower|footwear|mid|outer|accessory","description":"具体衣物类型和薄厚"}],"tips":["实用提示"]}。禁止品牌和具体商品，不从用户衣橱挑选衣物。\n室外：' +
    input.outdoorLowCelsius +
    "°C~" +
    input.outdoorHighCelsius +
    "°C，" +
    input.outdoorCondition +
    "\n行程：" +
    (scenes || "无") +
    "\n体感偏好：" +
    input.feelPreference +
    "\n最多5条tips，最多10层layers。只输出JSON。"
  );
}
