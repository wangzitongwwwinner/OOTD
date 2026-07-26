import Taro from '@tarojs/taro';

export interface SavedOutfitNode {
  clothingId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
}

export interface CreateOutfitInput {
  name: string;
  seasonTags: string[];
  colorTags: string[];
  canvasVersion: 1;
  nodes: SavedOutfitNode[];
}

export interface SavedOutfit extends CreateOutfitInput {
  id: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

type Call = (request: {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  body?: unknown;
}) => Promise<unknown>;

export function createOutfitService(call: Call) {
  async function invoke(request: Parameters<Call>[0]): Promise<unknown> {
    try {
      return await call(request);
    } catch {
      throw new Error('网络连接失败，请稍后重试');
    }
  }

  function parseOutfit(result: unknown): SavedOutfit {
    if (isFailureEnvelope(result)) throw new Error(result.error.message);
    if (!isSuccessEnvelope(result) || !isSavedOutfit(result.data)) {
      throw new Error('搭配响应异常，请稍后重试');
    }
    return result.data;
  }

  return {
    async create(input: CreateOutfitInput): Promise<SavedOutfit> {
      return parseOutfit(
        await invoke({ method: 'POST', path: '/v1/outfits', body: input }),
      );
    },

    async list(): Promise<SavedOutfit[]> {
      const result = await invoke({ method: 'GET', path: '/v1/outfits' });
      if (isFailureEnvelope(result)) throw new Error(result.error.message);
      if (
        !isSuccessEnvelope(result) ||
        !isRecord(result.data) ||
        !Array.isArray(result.data.items) ||
        !result.data.items.every(isSavedOutfit)
      ) {
        throw new Error('搭配响应异常，请稍后重试');
      }
      return result.data.items;
    },

    async get(id: string): Promise<SavedOutfit> {
      return parseOutfit(
        await invoke({ method: 'GET', path: `/v1/outfits/${id}` }),
      );
    },

    async delete(id: string, expectedVersion: number): Promise<void> {
      const result = await invoke({
        method: 'DELETE',
        path: `/v1/outfits/${id}`,
        body: { expectedVersion },
      });
      if (isFailureEnvelope(result)) throw new Error(result.error.message);
      if (!isSuccessEnvelope(result) || !isRecord(result.data)) {
        throw new Error('搭配删除响应异常，请稍后重试');
      }
    },
  };
}

export const outfitService = createOutfitService(async (data) => {
  const response = await Taro.cloud.callFunction({ name: 'api', data });
  return response.result;
});

function isSavedOutfit(value: unknown): value is SavedOutfit {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    Array.isArray(value.seasonTags) &&
    value.seasonTags.every((tag) => typeof tag === 'string') &&
    Array.isArray(value.colorTags) &&
    value.colorTags.every((tag) => typeof tag === 'string') &&
    value.canvasVersion === 1 &&
    Array.isArray(value.nodes) &&
    value.nodes.length > 0 &&
    value.nodes.every(isSavedOutfitNode) &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string' &&
    typeof value.version === 'number' &&
    Number.isInteger(value.version) &&
    value.version > 0
  );
}

function isSavedOutfitNode(value: unknown): value is SavedOutfitNode {
  return (
    isRecord(value) &&
    typeof value.clothingId === 'string' &&
    isNumberInRange(value.x, 0, 1) &&
    isNumberInRange(value.y, 0, 1) &&
    isNumberInRange(value.scale, 0.3, 3) &&
    isNumberInRange(value.rotation, -180, 180) &&
    typeof value.zIndex === 'number' &&
    Number.isInteger(value.zIndex) &&
    value.zIndex >= 0
  );
}

function isNumberInRange(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
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
