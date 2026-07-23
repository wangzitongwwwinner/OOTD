import {
  failure,
  success,
  type ApiEnvelope,
} from "../../../packages/contracts/src/index.ts";

import type { RequestContext, TrustedIdentity } from "./context.ts";
import { loginWithWechat } from "./auth/login.ts";
import type { UserRepository } from "./auth/user-repository.ts";
import type { CityResolver } from "./location/city-resolver.ts";
import { resolveCity } from "./location/resolve-city.ts";
import { getProfile, updateProfile } from "./profile/profile.ts";
import { listScenes } from "./scenes/list-scenes.ts";
import { createScene, updateScene } from "./scenes/manage-scenes.ts";
import { deleteScene } from "./scenes/delete-scene.ts";
import { getTodayItineraries } from "./itineraries/today.ts";
import {
  createItinerary,
  updateItinerary,
} from "./itineraries/manage-itineraries.ts";
import { deleteItinerary } from "./itineraries/delete-itinerary.ts";
import type { ItineraryRepository } from "./itineraries/repository.ts";
import type { SceneRepository } from "./scenes/scene-repository.ts";
import { getCurrentWeather } from "./weather/current-weather.ts";
import { orchestrateRecommendation } from "./recommendation/orchestrate-recommendation.ts";
import type { LlmProvider } from "./recommendation/llm-provider.ts";
import { listClothing } from "./clothing/list-clothing.ts";
import { createClothingUpload } from "./clothing/create-upload.ts";
import { completeClothingUpload } from "./clothing/complete-upload.ts";
import { deleteClothing } from "./clothing/delete-clothing.ts";
import { updateClothing } from "./clothing/update-clothing.ts";
import type { ClothingRepository } from "./clothing/repository.ts";
import {
  confirmCutoutJob,
  getCutoutJob,
  retryCutoutJob,
  startCutoutJob,
} from "./image-processing/jobs.ts";
import type { CutoutProvider } from "./image-processing/provider.ts";
import type { CutoutJobRepository } from "./image-processing/repository.ts";
import type {
  WeatherCacheRepository,
  WeatherProvider,
} from "./weather/weather-provider.ts";

interface RequestEvent {
  method?: unknown;
  path?: unknown;
  [key: string]: unknown;
}

interface WeatherDependencies {
  provider: WeatherProvider;
  cache: WeatherCacheRepository;
}

interface ImageProcessingDependencies {
  repository: CutoutJobRepository;
  provider: CutoutProvider;
}

export function createRequestContext(
  _event: RequestEvent,
  identity: TrustedIdentity,
  requestId: string,
): RequestContext {
  return { requestId, identity };
}

export async function routeRequest(
  event: RequestEvent,
  identity: TrustedIdentity,
  requestId: string,
  userRepository?: UserRepository,
  cityResolver?: CityResolver,
  weather?: WeatherDependencies,
  sceneRepository?: SceneRepository,
  itineraryRepository?: ItineraryRepository,
  llmProvider?: LlmProvider,
  clothingRepository?: ClothingRepository,
  imageProcessing?: ImageProcessingDependencies,
): Promise<ApiEnvelope<unknown>> {
  createRequestContext(event, identity, requestId);

  if (event.method === "GET" && event.path === "/health") {
    return success({ status: "ok" }, requestId);
  }

  if (event.method === "POST" && event.path === "/v1/auth/wechat/login") {
    if (!userRepository) {
      return failure(
        "INTERNAL_ERROR",
        "登录暂时不可用，请稍后重试",
        true,
        requestId,
      );
    }
    return loginWithWechat(event.body, identity, userRepository, requestId);
  }

  if (
    (event.method === "GET" || event.method === "PATCH") &&
    event.path === "/v1/profile"
  ) {
    if (!userRepository) {
      return failure(
        "INTERNAL_ERROR",
        "资料服务暂时不可用，请稍后重试",
        true,
        requestId,
      );
    }
    return event.method === "GET"
      ? getProfile(identity, userRepository, requestId)
      : updateProfile(event.body, identity, userRepository, requestId);
  }

  if (event.method === "POST" && event.path === "/v1/location/city") {
    if (!cityResolver) {
      return failure(
        "EXTERNAL_SERVICE_ERROR",
        "城市识别服务尚未配置，请稍后重试",
        true,
        requestId,
      );
    }
    return resolveCity(event.body, cityResolver, requestId);
  }

  if (event.method === "GET" && event.path === "/v1/weather/current") {
    if (!weather) {
      return failure(
        "EXTERNAL_SERVICE_ERROR",
        "天气服务尚未配置，请稍后重试",
        true,
        requestId,
      );
    }
    return getCurrentWeather(
      event.body,
      weather.provider,
      weather.cache,
      requestId,
    );
  }

  if (event.method === "GET" && event.path === "/v1/scenes") {
    if (!sceneRepository) {
      return failure(
        "INTERNAL_ERROR",
        "场景服务暂时不可用，请稍后重试",
        true,
        requestId,
      );
    }
    return listScenes(identity, sceneRepository, requestId);
  }

  if (event.method === "GET" && event.path === "/v1/clothing") {
    if (!clothingRepository)
      return failure(
        "INTERNAL_ERROR",
        "衣橱服务暂时不可用，请稍后重试",
        true,
        requestId,
      );
    return listClothing(identity, clothingRepository, requestId);
  }

  if (event.method === "POST" && event.path === "/v1/clothing/uploads") {
    if (!clothingRepository)
      return failure(
        "INTERNAL_ERROR",
        "衣橱服务暂时不可用，请稍后重试",
        true,
        requestId,
      );
    return createClothingUpload(
      event.body,
      identity,
      clothingRepository,
      requestId,
    );
  }

  if (
    event.method === "PATCH" &&
    typeof event.path === "string" &&
    /^\/v1\/clothing\/[^/]+\/source$/.test(event.path)
  ) {
    if (!clothingRepository)
      return failure(
        "INTERNAL_ERROR",
        "衣橱服务暂时不可用，请稍后重试",
        true,
        requestId,
      );
    const id = event.path.split("/")[3] ?? "";
    return completeClothingUpload(
      id,
      event.body,
      identity,
      clothingRepository,
      requestId,
    );
  }

  if (
    event.method === "PATCH" &&
    typeof event.path === "string" &&
    /^\/v1\/clothing\/[^/]+$/.test(event.path) &&
    !/\/source$/.test(event.path) &&
    !/\/confirm$/.test(event.path)
  ) {
    if (!clothingRepository)
      return failure(
        "INTERNAL_ERROR",
        "衣橱服务暂时不可用，请稍后重试",
        true,
        requestId,
      );
    const id = event.path.split("/")[3] ?? "";
    return updateClothing(
      id,
      event.body,
      identity,
      clothingRepository,
      requestId,
    );
  }


  if (
    event.method === "DELETE" &&
    typeof event.path === "string" &&
    /^\/v1\/clothing\/[^/]+$/.test(event.path)
  ) {
    if (!clothingRepository)
      return failure(
        "INTERNAL_ERROR",
        "衣橱服务暂时不可用，请稍后重试",
        true,
        requestId,
      );
    const id = event.path.split("/")[3] ?? "";
    return deleteClothing(
      id,
      event.body,
      identity,
      clothingRepository,
      requestId,
    );
  }
  if (event.method === "POST" && event.path === "/v1/image-processing/jobs") {
  if (
    event.method === "PATCH" &&
    typeof event.path === "string" &&
    /^\/v1\/clothing\/[^/]+$/.test(event.path) &&
    !/\/source$/.test(event.path) &&
    !/\/confirm$/.test(event.path)
  ) {
    if (!clothingRepository)
      return failure(
        "INTERNAL_ERROR",
        "衣橱服务暂时不可用，请稍后重试",
        true,
        requestId,
      );
    const id = event.path.split("/")[3] ?? "";
    return updateClothing(
      id,
      event.body,
      identity,
      clothingRepository,
      requestId,
    );
  }

    if (!imageProcessing)
      return failure(
        "EXTERNAL_SERVICE_ERROR",
        "智能抠图暂未配置，请稍后重试",
        true,
        requestId,
      );
    return startCutoutJob(event.body, identity, imageProcessing, requestId);
  }

  if (
    event.method === "GET" &&
    typeof event.path === "string" &&
    event.path.startsWith("/v1/image-processing/jobs/")
  ) {
    if (!imageProcessing)
      return failure(
        "EXTERNAL_SERVICE_ERROR",
        "智能抠图暂未配置，请稍后重试",
        true,
        requestId,
      );
    const id = event.path.slice("/v1/image-processing/jobs/".length);
    return getCutoutJob(id, identity, imageProcessing, requestId);
  }

  if (
    event.method === "POST" &&
    typeof event.path === "string" &&
    /^\/v1\/image-processing\/jobs\/[^/]+\/retry$/.test(event.path)
  ) {
    if (!imageProcessing)
      return failure(
        "EXTERNAL_SERVICE_ERROR",
        "智能抠图暂未配置，请稍后重试",
        true,
        requestId,
      );
    const id = event.path.split("/")[4] ?? "";
    return retryCutoutJob(id, event.body, identity, imageProcessing, requestId);
  }

  if (
    event.method === "POST" &&
    typeof event.path === "string" &&
    /^\/v1\/image-processing\/jobs\/[^/]+\/confirm$/.test(event.path)
  ) {
    if (!imageProcessing)
      return failure(
        "EXTERNAL_SERVICE_ERROR",
        "智能抠图暂未配置，请稍后重试",
        true,
        requestId,
      );
    const id = event.path.split("/")[4] ?? "";
    return confirmCutoutJob(
      id,
      event.body,
      identity,
      imageProcessing,
      requestId,
    );
  }

  if (event.method === "POST" && event.path === "/v1/scenes") {
    if (!sceneRepository) {
      return failure(
        "INTERNAL_ERROR",
        "场景服务暂时不可用，请稍后重试",
        true,
        requestId,
      );
    }
    return createScene(event.body, identity, sceneRepository, requestId);
  }

  if (
    event.method === "PATCH" &&
    typeof event.path === "string" &&
    event.path.startsWith("/v1/scenes/")
  ) {
    const id = (event.path as string).slice("/v1/scenes/".length);
    if (!id) {
      return failure("VALIDATION_ERROR", "缺少场景 ID", false, requestId);
    }
    if (!sceneRepository) {
      return failure(
        "INTERNAL_ERROR",
        "场景服务暂时不可用，请稍后重试",
        true,
        requestId,
      );
    }
    return updateScene(id, event.body, identity, sceneRepository, requestId);
  }

  if (
    event.method === "DELETE" &&
    typeof event.path === "string" &&
    event.path.startsWith("/v1/scenes/")
  ) {
    const id = (event.path as string).slice("/v1/scenes/".length);
    if (!id) {
      return failure("VALIDATION_ERROR", "缺少场景 ID", false, requestId);
    }
    if (!sceneRepository) {
      return failure(
        "INTERNAL_ERROR",
        "场景服务暂时不可用，请稍后重试",
        true,
        requestId,
      );
    }
    return deleteScene(id, identity, sceneRepository, requestId);
  }

  if (event.method === "GET" && event.path === "/v1/itineraries/today") {
    if (!itineraryRepository) {
      return failure(
        "INTERNAL_ERROR",
        "行程服务暂时不可用，请稍后重试",
        true,
        requestId,
      );
    }
    return getTodayItineraries(identity, itineraryRepository, requestId);
  }

  if (event.method === "POST" && event.path === "/v1/itineraries") {
    if (!itineraryRepository)
      return failure("INTERNAL_ERROR", "行程服务暂时不可用", true, requestId);
    return createItinerary(
      event.body,
      identity,
      itineraryRepository,
      requestId,
    );
  }

  if (
    event.method === "PATCH" &&
    typeof event.path === "string" &&
    event.path.startsWith("/v1/itineraries/")
  ) {
    const id = (event.path as string).slice("/v1/itineraries/".length);
    if (!id)
      return failure("VALIDATION_ERROR", "缺少行程 ID", false, requestId);
    if (!itineraryRepository)
      return failure("INTERNAL_ERROR", "行程服务暂时不可用", true, requestId);
    return updateItinerary(
      id,
      event.body,
      identity,
      itineraryRepository,
      requestId,
    );
  }

  if (
    event.method === "DELETE" &&
    typeof event.path === "string" &&
    event.path.startsWith("/v1/itineraries/")
  ) {
    const id = (event.path as string).slice("/v1/itineraries/".length);
    if (!id)
      return failure("VALIDATION_ERROR", "缺少行程 ID", false, requestId);
    if (!itineraryRepository)
      return failure("INTERNAL_ERROR", "行程服务暂时不可用", true, requestId);
    return deleteItinerary(id, identity, itineraryRepository, requestId);
  }

  if (event.method === "POST" && event.path === "/v1/recommendations") {
    if (!userRepository || !weather || !itineraryRepository) {
      return failure(
        "INTERNAL_ERROR",
        "建议服务暂时不可用，请稍后重试",
        true,
        requestId,
      );
    }
    return orchestrateRecommendation(
      event.body,
      identity,
      {
        users: userRepository,
        itineraries: itineraryRepository,
        weather,
        ...(llmProvider ? { llm: llmProvider } : {}),
      },
      requestId,
    );
  }

  return failure("NOT_FOUND", "请求的接口不存在", false, requestId);
}
