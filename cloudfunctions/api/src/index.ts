import { randomUUID } from 'node:crypto';

import * as cloudbase from '@cloudbase/node-sdk';

import { failure } from '../../../packages/contracts/src/index.ts';
import { CloudBaseUserRepository } from './auth/cloudbase-user-repository.ts';
import { trustedIdentityFromWxContext } from './context.ts';
import { QWeatherCityResolver } from './location/qweather-city-resolver.ts';
import { routeRequest } from './router.ts';
import { CloudBaseSceneRepository } from './scenes/cloudbase-scene-repository.ts';
import { CloudBaseItineraryRepository } from './itineraries/cloudbase-itinerary-repository.ts';
import { CloudBaseWeatherCache } from './weather/cloudbase-weather-cache.ts';
import { QWeatherProvider } from './weather/qweather-provider.ts';

const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV });
const userRepository = new CloudBaseUserRepository(app.database());
const cityResolver = createCityResolver();
const weather = createWeatherDependencies();
const sceneRepository = new CloudBaseSceneRepository(app.database());
const itineraryRepository = new CloudBaseItineraryRepository(app.database());

interface FunctionContext {
  requestId?: string;
}

export async function main(
  event: Record<string, unknown>,
  context: FunctionContext,
) {
  const userInfo = app.auth().getUserInfo();
  const requestId = context.requestId ?? `req_${randomUUID()}`;
  const identity = trustedIdentityFromWxContext({
    OPENID: userInfo.openId,
    APPID: userInfo.appId,
  });

  if (!identity) {
    return failure('UNAUTHORIZED', '请先登录后重试', false, requestId);
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
  );
}

function createCityResolver() {
  const host = process.env.QWEATHER_API_HOST;
  const apiKey = process.env.QWEATHER_API_KEY;
  return host && apiKey ? new QWeatherCityResolver({ host, apiKey }) : undefined;
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
