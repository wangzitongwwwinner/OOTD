import { randomUUID } from "node:crypto";

import * as cloudbase from "@cloudbase/node-sdk";
import { mps } from "tencentcloud-sdk-nodejs-mps";

import { failure } from "../../../packages/contracts/src/index.ts";
import { CloudBaseUserRepository } from "./auth/cloudbase-user-repository.ts";
import { trustedIdentityFromWxContext } from "./context.ts";
import { CloudBaseItineraryRepository } from "./itineraries/cloudbase-itinerary-repository.ts";
import { CloudBaseClothingRepository } from "./clothing/cloudbase-clothing-repository.ts";
import { CloudBaseCutoutJobRepository } from "./image-processing/cloudbase-job-repository.ts";
import { readMpsEnvironment } from "./image-processing/mps-config.ts";
import {
  TencentMpsCutoutProvider,
  type MpsClient,
} from "./image-processing/tencent-mps-provider.ts";
import { QWeatherCityResolver } from "./location/qweather-city-resolver.ts";
import { HunyuanProvider } from "./recommendation/hunyuan-provider.ts";
import { routeRequest } from "./router.ts";
import { CloudBaseSceneRepository } from "./scenes/cloudbase-scene-repository.ts";
import { CloudBaseWeatherCache } from "./weather/cloudbase-weather-cache.ts";
import { QWeatherProvider } from "./weather/qweather-provider.ts";

const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV });
const userRepository = new CloudBaseUserRepository(app.database());
const cityResolver = createCityResolver();
const weather = createWeatherDependencies();
const sceneRepository = new CloudBaseSceneRepository(app.database());
const itineraryRepository = new CloudBaseItineraryRepository(app.database());
const clothingRepository = new CloudBaseClothingRepository(app.database());
const llmProvider = createLlmProvider();
const imageProcessing = createImageProcessingDependencies();

interface FunctionContext {
  requestId?: string;
}

export async function main(
  event: Record<string, unknown>,
  context: FunctionContext,
) {
  const userInfo = app.auth().getUserInfo();
  const requestId = context.requestId ?? "req_" + randomUUID();

  const identity = trustedIdentityFromWxContext({
    OPENID: userInfo.openId,
    APPID: userInfo.appId,
  });

  if (!identity) {
    return failure("UNAUTHORIZED", "请先登录后重试", false, requestId);
  }

  return routeRequest(
    event,
    identity,
    requestId,
    userRepository,
    cityResolver,
    weather,
    sceneRepository,
    itineraryRepository,
    llmProvider,
    clothingRepository,
    imageProcessing,
  );
}

function createImageProcessingDependencies() {
  const config = readMpsEnvironment(process.env);
  if (!config) return undefined;
  const { secretId, secretKey, outputBucket, outputRegion, outputFileIdPrefix } =
    config;

  const Client = mps.v20190612.Client;
  const client = new Client({
    credential: { secretId, secretKey },
    region: outputRegion,
    profile: {
      httpProfile: { endpoint: "mps.tencentcloudapi.com", reqTimeout: 8 },
    },
  });
  const adapter: MpsClient = {
    processImage: async (input) =>
      (await client.ProcessImage(input as never)) as unknown as Record<
        string,
        unknown
      >,
    describeImageTaskDetail: async (input) =>
      (await client.DescribeImageTaskDetail(input)) as unknown as Record<
        string,
        unknown
      >,
  };
  const provider = new TencentMpsCutoutProvider({
    client: adapter,
    resolveSourceUrl: async (fileId) => {
      const result = await app.getTempFileURL({
        fileList: [{ fileID: fileId, maxAge: 600, urlType: "COS_URL" }],
      });
      const url = result.fileList[0]?.tempFileURL;
      if (!url) throw new Error("Source file URL unavailable");
      return url;
    },
    outputBucket,
    outputRegion,
    outputFileIdPrefix,
    timeoutMs: 8000,
  });
  return {
    repository: new CloudBaseCutoutJobRepository(app.database()),
    provider,
  };
}

function createLlmProvider() {
  const key = process.env.HUNYUAN_API_KEY?.trim();
  return key ? new HunyuanProvider(key) : undefined;
}

function createCityResolver() {
  const host = process.env.QWEATHER_API_HOST;
  const apiKey = process.env.QWEATHER_API_KEY;
  return host && apiKey
    ? new QWeatherCityResolver({ host, apiKey })
    : undefined;
}

function createWeatherDependencies() {
  const host = process.env.QWEATHER_API_HOST;
  const apiKey = process.env.QWEATHER_API_KEY;
  return host && apiKey
    ? {
        provider: new QWeatherProvider({ host, apiKey }),
        cache: new CloudBaseWeatherCache(app.database()),
      }
    : undefined;
}
