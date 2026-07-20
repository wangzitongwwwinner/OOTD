import Taro from '@tarojs/taro';

export interface Itinerary {
  id: string;
  startTime: string;
  sceneId: string;
  sceneName: string;
  sceneCategory: string;
  estimatedTemperatureCelsius: number;
  durationMinutes: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

type Call = (request: { method: 'GET'; path: string }) => Promise<unknown>;

export function createItineraryService(call: Call) {
  return {
    async listToday(): Promise<Itinerary[]> {
      let result: unknown;
      try {
        result = await call({ method: 'GET', path: '/v1/itineraries/today' });
      } catch { throw new Error('网络连接失败，请稍后重试'); }
      if (isFailureEnvelope(result)) throw new Error(result.error.message);
      if (!isSuccessEnvelope(result) || !Array.isArray(result.data?.items) || !result.data.items.every(isItinerary)) {
        throw new Error('行程响应异常，请稍后重试');
      }
      return result.data.items;
    },
  };
}

export const itineraryService = createItineraryService(async (data) => {
  const response = await Taro.cloud.callFunction({ name: 'api', data });
  return response.result;
});

function isItinerary(v: unknown): boolean {
  return typeof v === 'object' && v !== null && 'id' in v && 'sceneId' in v && 'startTime' in v;
}
function isRecord(v: unknown): v is Record<string, unknown> { return typeof v === 'object' && v !== null; }
function isSuccessEnvelope(v: unknown): v is { data: unknown } { return isRecord(v) && 'data' in v; }
function isFailureEnvelope(v: unknown): v is { error: { message: string } } {
  return isRecord(v) && isRecord(v.error) && typeof v.error.message === 'string';
}
