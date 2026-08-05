import assert from "node:assert/strict";
import test from "node:test";

import type { Profile } from "../../../../packages/contracts/src/index.ts";
import type { UserRepository } from "../auth/user-repository.ts";
import type { ItineraryRepository } from "../itineraries/repository.ts";
import type {
  WeatherCacheRepository,
  WeatherProvider,
} from "../weather/weather-provider.ts";
import type { LlmInput, LlmProvider } from "./llm-provider.ts";
import { orchestrateRecommendation } from "./orchestrate-recommendation.ts";

const identity = { openId: "trusted-open-id", appId: "trusted-app-id" };
const profile: Profile = {
  id: "user_1",
  nickname: "微信用户",
  recentFeelPreference: "cool",
  createdAt: "2026-07-22T00:00:00.000Z",
  updatedAt: "2026-07-22T00:00:00.000Z",
  version: 1,
};

function dependencies() {
  let llmInput: LlmInput | undefined;
  const users: UserRepository = {
    findOrCreateByWechatIdentity: async () => profile,
    findByWechatIdentity: async () => profile,
    updateFeelPreference: async () => ({ status: "not_found" }),
  };
  const itineraries: ItineraryRepository = {
    findByDate: async (date) => [
      {
        id: "i1",
        startTime: "08:00",
        sceneId: "metro",
        sceneName: "地铁",
        sceneCategory: "metro",
        estimatedTemperatureCelsius: 26,
        durationMinutes: 45,
        createdAt: date + "T00:00:00.000Z",
        updatedAt: date + "T00:00:00.000Z",
        version: 1,
      },
      {
        id: "i2",
        startTime: "09:00",
        sceneId: "office",
        sceneName: "办公室",
        sceneCategory: "office",
        estimatedTemperatureCelsius: 22,
        durationMinutes: 480,
        createdAt: date + "T00:00:00.000Z",
        updatedAt: date + "T00:00:00.000Z",
        version: 1,
      },
    ],
    create: async () => {
      throw new Error("unused");
    },
    findById: async () => undefined,
    update: async () => ({ status: "not_found" }),
    delete: async () => ({ status: "not_found" }),
  };
  const provider: WeatherProvider = {
    getCurrent: async (input) => ({
      ...input,
      localDate: "2026-07-22",
      condition: "多云",
      temperatureCelsius: 28,
      feelsLikeCelsius: 29,
      highCelsius: 31,
      lowCelsius: 21,
      observedAt: "2026-07-22T02:00:00.000Z",
      source: "qweather",
      isStale: false,
    }),
  };
  const cache: WeatherCacheRepository = {
    find: async () => undefined,
    save: async () => undefined,
  };
  const llm: LlmProvider = {
    generateRecommendation: async (input) => {
      llmInput = input;
      return {
        summary: "分层穿着",
        layers: [{ type: "base", description: "棉质 T 恤" }],
        tips: [],
        source: "llm",
      };
    },
  };
  return {
    deps: { users, itineraries, weather: { provider, cache }, llm },
    readLlmInput: () => llmInput,
  };
}

test("服务端从可信数据组装完整全天建议输入", async () => {
  const fixture = dependencies();
  const response = await orchestrateRecommendation(
    { cityCode: "101020100", cityName: "上海" },
    identity,
    fixture.deps,
    "req_rec",
  );
  assert.equal("data" in response && response.data.source, "llm");
  assert.deepEqual(fixture.readLlmInput(), {
    outdoorHighCelsius: 31,
    outdoorLowCelsius: 21,
    outdoorCondition: "多云",
    itineraries: [
      { sceneName: "地铁", temperatureCelsius: 26, durationMinutes: 45 },
      { sceneName: "办公室", temperatureCelsius: 22, durationMinutes: 480 },
    ],
    feelPreference: "cool",
  });
});

test("拒绝客户端伪造行程和体感数据", async () => {
  const fixture = dependencies();
  const response = await orchestrateRecommendation(
    {
      cityCode: "101020100",
      cityName: "上海",
      itineraries: [],
      feelPreference: "cold",
    },
    identity,
    fixture.deps,
    "req_invalid",
  );
  assert.equal("error" in response && response.error.code, "VALIDATION_ERROR");
  assert.equal(fixture.readLlmInput(), undefined);
});
