import Taro from '@tarojs/taro';
import type { CityLocation } from '../weather/location-service';

export type RecommendationLayerType =
  'upper' | 'lower' | 'footwear' | 'base' | 'mid' | 'outer' | 'accessory';
export interface RecommendationLayer {
  type: RecommendationLayerType;
  description: string;
}
export interface Recommendation {
  recommendationId: string;
  summary: string;
  layers: RecommendationLayer[];
  tips: string[];
  source: 'llm' | 'rules';
}

interface RecommendationRequest {
  method: 'POST';
  path: '/v1/recommendations';
  body: CityLocation;
}
type Call = (request: RecommendationRequest) => Promise<unknown>;

export function createRecommendationService(call: Call) {
  return {
    async generate(city: CityLocation): Promise<Recommendation> {
      let result: unknown;
      try {
        result = await call({
          method: 'POST',
          path: '/v1/recommendations',
          body: city,
        });
      } catch {
        throw new Error('网络连接失败，请稍后重试');
      }
      if (isFailureEnvelope(result)) throw new Error(result.error.message);
      if (!isSuccessEnvelope(result) || !isRecommendation(result.data)) {
        throw new Error('建议响应异常，请稍后重试');
      }
      return { ...result.data, recommendationId: result.requestId };
    },
  };
}

export const recommendationService = createRecommendationService(
  async (data) => {
    const response = await Taro.cloud.callFunction({ name: 'api', data });
    return response.result;
  },
);

function isRecommendation(value: unknown): value is Recommendation {
  if (
    !isRecord(value) ||
    typeof value.summary !== 'string' ||
    !value.summary ||
    !Array.isArray(value.layers) ||
    !Array.isArray(value.tips)
  )
    return false;
  return (
    (value.source === 'llm' || value.source === 'rules') &&
    value.layers.length > 0 &&
    value.layers.every(
      (layer) =>
        isRecord(layer) &&
        [
          'upper',
          'lower',
          'footwear',
          'base',
          'mid',
          'outer',
          'accessory',
        ].includes(String(layer.type)) &&
        typeof layer.description === 'string' &&
        Boolean(layer.description),
    ) &&
    value.tips.every((tip) => typeof tip === 'string')
  );
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
function isSuccessEnvelope(
  value: unknown,
): value is { data: unknown; requestId: string } {
  return (
    isRecord(value) &&
    'data' in value &&
    typeof value.requestId === 'string' &&
    Boolean(value.requestId)
  );
}
function isFailureEnvelope(
  value: unknown,
): value is { error: { message: string } } {
  return (
    isRecord(value) &&
    isRecord(value.error) &&
    typeof value.error.message === 'string'
  );
}
