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
            "你是专业的穿衣搭配顾问，根据用户信息输出穿搭建议 JSON。",
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
    '根据以下信息，输出一套可通过穿脱应对全天温差的穿衣建议。只输出 JSON：{"summary":"一句话总结","layers":[{"type":"base|mid|outer|accessory","description":"具体材质描述"}],"tips":["实用提示"]}。禁止品牌、款式、版型、风格词，聚焦材质和类型。\n室外：' +
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
