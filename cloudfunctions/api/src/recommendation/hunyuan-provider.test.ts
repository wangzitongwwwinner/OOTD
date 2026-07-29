import assert from "node:assert/strict";
import test from "node:test";
import { HunyuanProvider } from "./hunyuan-provider.ts";

const input = {
  outdoorHighCelsius: 28,
  outdoorLowCelsius: 18,
  outdoorCondition: "晴",
  itineraries: [
    { sceneName: "办公室", temperatureCelsius: 22, durationMinutes: 480 },
  ],
  feelPreference: "comfortable",
};

test("Responses API 存在 reasoning 时读取 message 中的最终 JSON", async () => {
  let requestBody: Record<string, unknown> | undefined;
  const fetcher: typeof fetch = async (_url, init) => {
    requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response(
      JSON.stringify({
        status: "completed",
        output: [
          {
            type: "reasoning",
            summary: [
              {
                type: "summary_text",
                text: "我们根据用户提供的信息进行分析。",
              },
            ],
          },
          {
            type: "message",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: '{"summary":"建议分层穿着","layers":[{"type":"base","description":"短袖 T 恤"}],"tips":[]}',
              },
            ],
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await new HunyuanProvider(
    "test-key",
    fetcher,
  ).generateRecommendation(input, 4000);

  assert.equal(result.summary, "建议分层穿着");
  assert.equal(result.source, "llm");
  assert.deepEqual(requestBody?.reasoning, { effort: "none" });
});

test("Responses API 没有 message 最终文本时拒绝解析 reasoning 摘要", async () => {
  const fetcher: typeof fetch = async () =>
    new Response(
      JSON.stringify({
        status: "completed",
        output: [
          {
            type: "reasoning",
            summary: [
              { type: "summary_text", text: '{"summary":"不应被读取"}' },
            ],
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );

  await assert.rejects(
    () =>
      new HunyuanProvider("test-key", fetcher).generateRecommendation(
        input,
        4000,
      ),
    /LLM empty response/,
  );
});

test("提示词要求实用的上下身建议并限制夏季不合理衣物", async () => {
  let requestBody: Record<string, unknown> | undefined;
  const fetcher: typeof fetch = async (_url, init) => {
    requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response(
      JSON.stringify({
        output: [
          {
            type: "message",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: '{"summary":"穿短袖和长裤","layers":[{"type":"upper","description":"短袖 T 恤"},{"type":"lower","description":"轻薄长裤"}],"tips":[]}',
              },
            ],
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  await new HunyuanProvider("test-key", fetcher).generateRecommendation(
    {
      outdoorHighCelsius: 34,
      outdoorLowCelsius: 26,
      outdoorCondition: "阵雨",
      itineraries: [],
      feelPreference: "cold",
    },
    4000,
  );

  const prompt = String(requestBody?.input);
  const instructions = String(requestBody?.instructions);
  assert.match(prompt, /上身/);
  assert.match(prompt, /下身/);
  assert.match(prompt, /雨天.*鞋履/);
  assert.match(prompt, /夏季.*风衣.*夹克.*围巾/);
  assert.match(prompt, /偏冷.*薄外套/);
  assert.match(prompt, /同一件衣物.*重复/);
  assert.match(prompt, /鞋履.*宽泛/);
  assert.match(prompt, /停留时长/);
  assert.match(prompt, /可选建议.*如果.*可以/);
  assert.match(prompt, /第二人称.*您/);
  assert.match(instructions, /朴实/);
  assert.match(prompt, /不使用.*洋葱式穿法/);
});
