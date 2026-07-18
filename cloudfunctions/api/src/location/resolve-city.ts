import {
  cityLocationSchema,
  failure,
  resolveCityRequestSchema,
  success,
  type ApiEnvelope,
  type CityLocation,
} from '../../../../packages/contracts/src/index.ts';

import type { CityResolver } from './city-resolver.ts';

export async function resolveCity(
  body: unknown,
  resolver: CityResolver,
  requestId: string,
): Promise<ApiEnvelope<CityLocation>> {
  const parsed = resolveCityRequestSchema.safeParse(body);
  if (!parsed.success) {
    return failure('VALIDATION_ERROR', '定位信息无效，请重新定位', false, requestId);
  }
  try {
    return success(cityLocationSchema.parse(await resolver.resolve(parsed.data)), requestId);
  } catch {
    return failure(
      'EXTERNAL_SERVICE_ERROR',
      '暂时无法识别所在城市，请稍后重试',
      true,
      requestId,
    );
  }
}
