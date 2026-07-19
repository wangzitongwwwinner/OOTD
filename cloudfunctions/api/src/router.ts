import {
  failure,
  success,
  type ApiEnvelope,
} from '../../../packages/contracts/src/index.ts';

import type { RequestContext, TrustedIdentity } from './context.ts';
import { loginWithWechat } from './auth/login.ts';
import type { UserRepository } from './auth/user-repository.ts';
import type { CityResolver } from './location/city-resolver.ts';
import { resolveCity } from './location/resolve-city.ts';
import { getProfile, updateProfile } from './profile/profile.ts';
import { listScenes } from './scenes/list-scenes.ts';
import type { SceneRepository } from './scenes/scene-repository.ts';
import { getCurrentWeather } from './weather/current-weather.ts';
import type {
  WeatherCacheRepository,
  WeatherProvider,
} from './weather/weather-provider.ts';

interface RequestEvent {
  method?: unknown;
  path?: unknown;
  [key: string]: unknown;
}

interface WeatherDependencies {
  provider: WeatherProvider;
  cache: WeatherCacheRepository;
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
): Promise<ApiEnvelope<unknown>> {
  createRequestContext(event, identity, requestId);

  if (event.method === 'GET' && event.path === '/health') {
    return success({ status: 'ok' }, requestId);
  }

  if (event.method === 'POST' && event.path === '/v1/auth/wechat/login') {
    if (!userRepository) {
      return failure(
        'INTERNAL_ERROR',
        '登录暂时不可用，请稍后重试',
        true,
        requestId,
      );
    }
    return loginWithWechat(event.body, identity, userRepository, requestId);
  }

  if (
    (event.method === 'GET' || event.method === 'PATCH') &&
    event.path === '/v1/profile'
  ) {
    if (!userRepository) {
      return failure(
        'INTERNAL_ERROR',
        '资料服务暂时不可用，请稍后重试',
        true,
        requestId,
      );
    }
    return event.method === 'GET'
      ? getProfile(identity, userRepository, requestId)
      : updateProfile(event.body, identity, userRepository, requestId);
  }

  if (event.method === 'POST' && event.path === '/v1/location/city') {
    if (!cityResolver) {
      return failure(
        'EXTERNAL_SERVICE_ERROR',
        '城市识别服务尚未配置，请稍后重试',
        true,
        requestId,
      );
    }
    return resolveCity(event.body, cityResolver, requestId);
  }

  if (event.method === 'GET' && event.path === '/v1/weather/current') {
    if (!weather) {
      return failure(
        'EXTERNAL_SERVICE_ERROR',
        '天气服务尚未配置，请稍后重试',
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

  if (event.method === 'GET' && event.path === '/v1/scenes') {
    if (!sceneRepository) {
      return failure(
        'INTERNAL_ERROR',
        '场景服务暂时不可用，请稍后重试',
        true,
        requestId,
      );
    }
    return listScenes(identity, sceneRepository, requestId);
  }

  return failure(
    'NOT_FOUND',
    '请求的接口不存在',
    false,
    requestId,
  );
}
