import { randomUUID } from 'node:crypto';

import * as cloudbase from '@cloudbase/node-sdk';

import { failure } from '../../../packages/contracts/src/index.ts';
import { CloudBaseUserRepository } from './auth/cloudbase-user-repository.ts';
import { trustedIdentityFromWxContext } from './context.ts';
import { QWeatherCityResolver } from './location/qweather-city-resolver.ts';
import { routeRequest } from './router.ts';

const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV });
const userRepository = new CloudBaseUserRepository(app.database());
const cityResolver = createCityResolver();

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

  return routeRequest(event, identity, requestId, userRepository, cityResolver);
}

function createCityResolver() {
  const host = process.env.QWEATHER_API_HOST;
  const apiKey = process.env.QWEATHER_API_KEY;
  return host && apiKey ? new QWeatherCityResolver({ host, apiKey }) : undefined;
}
