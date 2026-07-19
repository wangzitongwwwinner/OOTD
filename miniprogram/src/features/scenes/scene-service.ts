import Taro from '@tarojs/taro';

export type SceneCategory =
  'office' | 'home' | 'metro' | 'mall' | 'outdoor' | 'custom';
export type SceneFeel = 'cold' | 'comfortable' | 'stuffy' | 'cool';

export interface Scene {
  id: string;
  name: string;
  category: SceneCategory;
  estimatedTemperatureCelsius: number;
  feel: SceneFeel;
  isPreset: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

type Call = (request: {
  method: 'GET';
  path: '/v1/scenes';
}) => Promise<unknown>;

export function createSceneService(call: Call) {
  return {
    async list(): Promise<Scene[]> {
      let result: unknown;
      try {
        result = await call({ method: 'GET', path: '/v1/scenes' });
      } catch {
        throw new Error('网络连接失败，请稍后重试');
      }
      if (isFailureEnvelope(result)) throw new Error(result.error.message);
      if (
        !isSuccessEnvelope(result) ||
        !isRecord(result.data) ||
        !Array.isArray(result.data.items) ||
        !result.data.items.every(isScene)
      ) {
        throw new Error('场景响应异常，请稍后重试');
      }
      return result.data.items;
    },
  };
}

export const sceneService = createSceneService(async (data) => {
  const response = await Taro.cloud.callFunction({ name: 'api', data });
  return response.result;
});

function isScene(value: unknown): value is Scene {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    ['office', 'home', 'metro', 'mall', 'outdoor', 'custom'].includes(
      String(value.category),
    ) &&
    typeof value.estimatedTemperatureCelsius === 'number' &&
    ['cold', 'comfortable', 'stuffy', 'cool'].includes(String(value.feel)) &&
    typeof value.isPreset === 'boolean' &&
    (value.note === undefined || typeof value.note === 'string') &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string' &&
    typeof value.version === 'number'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSuccessEnvelope(value: unknown): value is { data: unknown } {
  return isRecord(value) && 'data' in value;
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
