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
