import assert from "node:assert/strict";
import test from "node:test";

import type { Profile } from "../../../packages/contracts/src/index.ts";
import type { UserRepository } from "./auth/user-repository.ts";
import {
  trustedIdentityFromWxContext,
  type TrustedIdentity,
} from "./context.ts";
import type { CityResolver } from "./location/city-resolver.ts";
import { createRequestContext, routeRequest } from "./router.ts";
import type { SceneRepository } from "./scenes/scene-repository.ts";
import type { ItineraryRepository } from "./itineraries/repository.ts";
import type { LlmProvider } from "./recommendation/llm-provider.ts";
import type { ClothingRepository } from "./clothing/repository.ts";
import type { CutoutProvider } from "./image-processing/provider.ts";
import type { CutoutJobRepository } from "./image-processing/repository.ts";
import type {
  WeatherCacheRepository,
  WeatherProvider,
} from "./weather/weather-provider.ts";

const profile: Profile = {
  id: "user_1",
  nickname: "微信用户",
  recentFeelPreference: "comfortable",
  createdAt: "2026-07-18T02:00:00.000Z",
  updatedAt: "2026-07-18T02:00:00.000Z",
  version: 1,
};

const profileRepository: UserRepository = {
  findOrCreateByWechatIdentity: async () => profile,
  findByWechatIdentity: async () => profile,
  updateFeelPreference: async () => ({
    status: "updated",
    profile: { ...profile, recentFeelPreference: "cool", version: 2 },
  }),
};

const cityResolver: CityResolver = {
  resolve: async () => ({ cityCode: "101020100", cityName: "上海" }),
};

const weatherProvider: WeatherProvider = {
  getCurrent: async (input) => ({
    cityCode: input.cityCode,
    cityName: input.cityName,
    localDate: "2026-07-20",
    condition: "多云",
    temperatureCelsius: 31,
    feelsLikeCelsius: 35,
    humidityPercent: 68,
    highCelsius: 34,
    lowCelsius: 27,
    uvIndex: 7,
    windSpeedKilometersPerHour: 14,
    observedAt: "2026-07-20T02:00:00.000Z",
    source: "qweather",
    isStale: false,
  }),
};

const weatherCache: WeatherCacheRepository = {
  find: async () => undefined,
  save: async () => undefined,
};

const sceneRepository: SceneRepository = {
  findCustomByIdentity: async () => [],
  create: async () => ({
    id: "scene_test",
    name: "测试场景",
    category: "custom",
    estimatedTemperatureCelsius: 25,
    feel: "comfortable",
    isPreset: false,
    createdAt: "2026-07-20T01:00:00.000Z",
    updatedAt: "2026-07-20T01:00:00.000Z",
    version: 1,
  }),
  findById: async () => undefined,
  update: async () => ({ status: "not_found" }),
  delete: async () => ({ status: "not_found" }),
};

test("GET /health 返回统一成功信封", async () => {
  const response = await routeRequest(
    { method: "GET", path: "/health" },
    { openId: "trusted-open-id", appId: "trusted-app-id" },
    "req_health",
  );
  assert.deepEqual(response, {
    data: { status: "ok" },
    requestId: "req_health",
  });
});

test("GET /v1/clothing 接入可信身份衣物列表", async () => {
  const clothing: ClothingRepository = {
    findByIdentity: async () => [
      {
        id: "clothing_1",
        name: "白色 T 恤",
        category: "top",
        color: "白色",
        sourceFileId: "cloud://source",
        processedFileId: "cloud://processed",
        processingStatus: "ready",
        createdAt: "2026-07-22T00:00:00.000Z",
        updatedAt: "2026-07-22T00:00:00.000Z",
        version: 1,
      },
    ],
    createUploadDraft: async () => {
      throw new Error("unused");
    },
    completeUpload: async () => ({ status: "not_found" }),
  };
  const response = await routeRequest(
    { method: "GET", path: "/v1/clothing" },
    { openId: "trusted-open-id", appId: "trusted-app-id" },
    "req_clothing",
    profileRepository,
    cityResolver,
    undefined,
    undefined,
    undefined,
    undefined,
    clothing,
  );
  assert.equal(
    "data" in response &&
      response.data !== null &&
      typeof response.data === "object" &&
      "items" in response.data &&
      Array.isArray(response.data.items) &&
      response.data.items.length,
    1,
  );
});

test("POST /v1/clothing/uploads 创建可信身份的上传草稿", async () => {
  let receivedIdentity: TrustedIdentity | undefined;
  const clothing: ClothingRepository = {
    findByIdentity: async () => [],
    completeUpload: async () => ({ status: "not_found" }),
    createUploadDraft: async (_input, identity) => {
      receivedIdentity = identity;
      return {
        clothing: {
          id: "clothing_2",
          name: "黑色衬衫",
          category: "top",
          color: "黑色",
          sourceFileId: "cloud://source",
          processingStatus: "draft",
          createdAt: "2026-07-22T08:00:00.000Z",
          updatedAt: "2026-07-22T08:00:00.000Z",
          version: 1,
        },
        uploadPath: "clothing-sources/user_1/clothing_2.png",
      };
    },
  };
  const result = await routeRequest(
    {
      method: "POST",
      path: "/v1/clothing/uploads",
      body: {
        name: "黑色衬衫",
        category: "top",
        color: "黑色",
        extension: "png",
        mimeType: "image/png",
        sizeBytes: 4096,
      },
    },
    { openId: "trusted-open-id", appId: "trusted-app-id" },
    "req_clothing_upload",
    profileRepository,
    cityResolver,
    undefined,
    undefined,
    undefined,
    undefined,
    clothing,
  );
  assert.deepEqual(receivedIdentity, {
    openId: "trusted-open-id",
    appId: "trusted-app-id",
  });
  assert.equal(
    "data" in result &&
      (result.data as { clothing: { id: string } }).clothing.id,
    "clothing_2",
  );
});

test("PATCH /v1/clothing/:id/source 确认正式云存储文件", async () => {
  const clothing: ClothingRepository = {
    findByIdentity: async () => [],
    createUploadDraft: async () => {
      throw new Error("unused");
    },
    completeUpload: async () => ({
      status: "updated",
      clothing: {
        id: "clothing_2",
        name: "新衣物",
        category: "top",
        color: "待补充",
        sourceFileId: "cloud://env/clothing-sources/user_1/clothing_2.jpg",
        processingStatus: "draft",
        createdAt: "2026-07-22T08:00:00.000Z",
        updatedAt: "2026-07-22T08:01:00.000Z",
        version: 2,
      },
    }),
  };
  const result = await routeRequest(
    {
      method: "PATCH",
      path: "/v1/clothing/clothing_2/source",
      body: {
        fileId: "cloud://env/clothing-sources/user_1/clothing_2.jpg",
        expectedVersion: 1,
      },
    },
    { openId: "trusted-open-id", appId: "trusted-app-id" },
    "req_source",
    profileRepository,
    cityResolver,
    undefined,
    undefined,
    undefined,
    undefined,
    clothing,
  );
  assert.equal(
    "data" in result && (result.data as { version: number }).version,
    2,
  );
});

test("图片处理任务路由使用可信身份创建和查询任务", async () => {
  const jobRepository: CutoutJobRepository = {
    begin: async () => ({
      status: "created",
      job: {
        id: "cutout_1",
        clothingId: "clothing_2",
        status: "processing",
        attempts: 1,
        sourceFileId: "cloud://source.jpg",
        createdAt: "2026-07-22T08:00:00.000Z",
        updatedAt: "2026-07-22T08:00:00.000Z",
        version: 1,
      },
    }),
    attachProviderTask: async (job, providerTaskId) => ({
      ...job,
      providerTaskId,
    }),
    findById: async () => ({
      id: "cutout_1",
      clothingId: "clothing_2",
      status: "processing",
      attempts: 1,
      sourceFileId: "cloud://source.jpg",
      providerTaskId: "mps_1",
      createdAt: "2026-07-22T08:00:00.000Z",
      updatedAt: "2026-07-22T08:00:00.000Z",
      version: 1,
    }),
    succeed: async (job) => job,
    fail: async (job) => ({
      ...job,
      status: "failed",
      message: "智能抠图失败，请重试",
    }),
    retry: async () => ({
      status: "retried",
      job: {
        id: "cutout_1",
        clothingId: "clothing_2",
        status: "processing",
        attempts: 2,
        sourceFileId: "cloud://source.jpg",
        createdAt: "2026-07-22T08:00:00.000Z",
        updatedAt: "2026-07-22T08:02:00.000Z",
        version: 2,
      },
    }),
  };
  const provider: CutoutProvider = {
    submit: async () => ({ taskId: "mps_1" }),
    inspect: async () => ({ status: "processing" }),
  };
  const created = await routeRequest(
    {
      method: "POST",
      path: "/v1/image-processing/jobs",
      body: { clothingId: "clothing_2", expectedVersion: 2 },
    },
    { openId: "trusted-open-id", appId: "trusted-app-id" },
    "req_job_create",
    profileRepository,
    cityResolver,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    { repository: jobRepository, provider },
  );
  assert.equal(
    "data" in created && (created.data as { id: string }).id,
    "cutout_1",
  );
  const fetched = await routeRequest(
    { method: "GET", path: "/v1/image-processing/jobs/cutout_1" },
    { openId: "trusted-open-id", appId: "trusted-app-id" },
    "req_job_get",
    profileRepository,
    cityResolver,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    { repository: jobRepository, provider },
  );
  assert.equal(
    "data" in fetched && (fetched.data as { status: string }).status,
    "processing",
  );
  const retried = await routeRequest(
    {
      method: "POST",
      path: "/v1/image-processing/jobs/cutout_1/retry",
      body: { expectedVersion: 1 },
    },
    { openId: "trusted-open-id", appId: "trusted-app-id" },
    "req_job_retry",
    profileRepository,
    cityResolver,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    { repository: jobRepository, provider },
  );
  assert.equal(
    "data" in retried && (retried.data as { attempts: number }).attempts,
    2,
  );
});

test("GET 与 PATCH /v1/profile 接入资料用例", async () => {
  const identity = { openId: "trusted-open-id", appId: "trusted-app-id" };
  const getResponse = await routeRequest(
    { method: "GET", path: "/v1/profile" },
    identity,
    "req_profile_get",
    profileRepository,
  );
  assert.deepEqual(getResponse, {
    data: profile,
    requestId: "req_profile_get",
  });

  const patchResponse = await routeRequest(
    {
      method: "PATCH",
      path: "/v1/profile",
      body: { recentFeelPreference: "cool", expectedVersion: 1 },
    },
    identity,
    "req_profile_patch",
    profileRepository,
  );
  assert.deepEqual(patchResponse, {
    data: { ...profile, recentFeelPreference: "cool", version: 2 },
    requestId: "req_profile_patch",
  });
});

test("POST /v1/location/city 接入城市解析用例", async () => {
  const response = await routeRequest(
    {
      method: "POST",
      path: "/v1/location/city",
      body: { latitude: 31.2304, longitude: 121.4737 },
    },
    { openId: "trusted-open-id", appId: "trusted-app-id" },
    "req_city",
    profileRepository,
    cityResolver,
  );
  assert.deepEqual(response, {
    data: { cityCode: "101020100", cityName: "上海" },
    requestId: "req_city",
  });
});

test("GET /v1/weather/current 接入天气用例", async () => {
  const response = await routeRequest(
    {
      method: "GET",
      path: "/v1/weather/current",
      body: { cityCode: "101020100", cityName: "上海" },
    },
    { openId: "trusted-open-id", appId: "trusted-app-id" },
    "req_weather",
    profileRepository,
    cityResolver,
    { provider: weatherProvider, cache: weatherCache },
  );
  assert.deepEqual(response, {
    data: await weatherProvider.getCurrent({
      cityCode: "101020100",
      cityName: "上海",
    }),
    requestId: "req_weather",
  });
});

test("GET /v1/scenes 接入可信身份场景查询", async () => {
  const response = await routeRequest(
    { method: "GET", path: "/v1/scenes" },
    { openId: "trusted-open-id", appId: "trusted-app-id" },
    "req_scenes",
    profileRepository,
    cityResolver,
    { provider: weatherProvider, cache: weatherCache },
    sceneRepository,
  );
  assert.equal(
    "data" in response &&
      response.data !== null &&
      typeof response.data === "object" &&
      "items" in response.data &&
      Array.isArray(response.data.items),
    true,
  );
});

test("未知路由返回不可重试的 NOT_FOUND", async () => {
  const response = await routeRequest(
    { method: "POST", path: "/v1/unknown" },
    { openId: "trusted-open-id", appId: "trusted-app-id" },
    "req_missing",
  );
  assert.deepEqual(response, {
    error: { code: "NOT_FOUND", message: "请求的接口不存在", retryable: false },
    requestId: "req_missing",
  });
});

test("POST /v1/recommendations 使用可信用户、天气和全部当天行程", async () => {
  const itineraries: ItineraryRepository = {
    findByDate: async (date) => [
      {
        id: "i1",
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
  const llm: LlmProvider = {
    generateRecommendation: async (input) => ({
      summary: input.itineraries[0]?.sceneName ?? "",
      layers: [{ type: "base", description: input.feelPreference }],
      tips: [],
      source: "llm",
    }),
  };
  const response = await routeRequest(
    {
      method: "POST",
      path: "/v1/recommendations",
      body: { cityCode: "101020100", cityName: "上海" },
    },
    { openId: "trusted-open-id", appId: "trusted-app-id" },
    "req_rec",
    profileRepository,
    cityResolver,
    { provider: weatherProvider, cache: weatherCache },
    sceneRepository,
    itineraries,
    llm,
  );
  assert.equal(
    "data" in response &&
      response.data !== null &&
      typeof response.data === "object" &&
      "source" in response.data &&
      response.data.source,
    "llm",
  );
  assert.equal(
    "data" in response &&
      response.data !== null &&
      typeof response.data === "object" &&
      "summary" in response.data &&
      response.data.summary,
    "办公室",
  );
});

test("请求上下文只信任平台身份并忽略客户端伪造 userId", () => {
  const context = createRequestContext(
    {
      method: "GET",
      path: "/health",
      userId: "client-forged-user",
      openId: "client-forged-open-id",
    },
    { openId: "trusted-open-id", appId: "trusted-app-id" },
    "req_context",
  );
  assert.deepEqual(context, {
    requestId: "req_context",
    identity: { openId: "trusted-open-id", appId: "trusted-app-id" },
  });
  assert.equal("userId" in context, false);
});

test("平台身份缺少 OPENID 或 APPID 时拒绝建立可信身份", () => {
  assert.equal(
    trustedIdentityFromWxContext({ OPENID: "", APPID: "trusted-app-id" }),
    undefined,
  );
  assert.equal(
    trustedIdentityFromWxContext({ OPENID: "trusted-open-id" }),
    undefined,
  );
});
