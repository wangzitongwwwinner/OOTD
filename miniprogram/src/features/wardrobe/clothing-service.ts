import Taro from '@tarojs/taro';

export type ClothingCategory = 'top' | 'bottom' | 'shoes' | 'accessory';
export interface ClothingImageFile {
  tempFilePath: string;
  size: number;
}
export interface ClothingMetadata {
  name: string;
  category: ClothingCategory;
  color: string;
}
export interface ClothingDraft {
  id: string;
  name: string;
  category: ClothingCategory;
  color: string;
  sourceFileId: string;
  processingStatus: 'draft';
  createdAt: string;
  updatedAt: string;
  version: number;
}
export interface PublicClothing extends Omit<
  ClothingDraft,
  'processingStatus'
> {
  processedFileId?: string;
  processingStatus: 'draft' | 'processing' | 'review' | 'ready' | 'failed';
}
export interface CutoutJob {
  id: string;
  clothingId: string;
  status: 'queued' | 'processing' | 'succeeded' | 'failed';
  attempts: number;
  processedFileId?: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}
export interface PollCancellation {
  cancelled: boolean;
}

export async function ensureMediaSourceAccess(
  source: 'camera' | 'album',
): Promise<void> {
  if (source === 'album') return;
  try {
    const setting = await Taro.getSetting();
    if (setting.authSetting['scope.camera'] === true) return;
    await Taro.authorize({ scope: 'scope.camera' });
  } catch {
    throw new Error('无法访问相机，请在设置中允许后重试');
  }
}

export function mediaSelectionErrorMessage(cause: unknown): string | undefined {
  const detail = cause instanceof Error ? cause.message : String(cause ?? '');
  if (/cancel/i.test(detail)) return undefined;
  if (/auth|deny|permission/i.test(detail))
    return '无法访问相机或相册，请在设置中允许后重试';
  return '图片选择失败，请重试';
}

export function validateClothingImage(file: ClothingImageFile) {
  const match = /\.([A-Za-z0-9]+)$/.exec(file.tempFilePath);
  const extension = match?.[1]?.toLowerCase();
  if (extension !== 'jpg' && extension !== 'jpeg' && extension !== 'png') {
    throw new Error('请选择 JPG 或 PNG 图片');
  }
  if (
    !Number.isFinite(file.size) ||
    file.size <= 0 ||
    file.size > 10 * 1024 * 1024
  ) {
    throw new Error('图片大小不能超过 10 MB');
  }
  return {
    extension,
    mimeType:
      extension === 'png' ? ('image/png' as const) : ('image/jpeg' as const),
  };
}

export async function uploadClothingSource(
  file: ClothingImageFile,
  metadata: ClothingMetadata,
) {
  const image = validateClothingImage(file);
  const response = await Taro.cloud.callFunction({
    name: 'api',
    data: {
      method: 'POST',
      path: '/v1/clothing/uploads',
      body: {
        ...metadata,
        ...image,
        sizeBytes: file.size,
      },
    },
  });
  const result = response.result;
  if (isFailure(result)) throw new Error(result.error.message);
  if (!isUploadResult(result)) throw new Error('上传准备失败，请稍后重试');
  let uploaded: Awaited<ReturnType<typeof Taro.cloud.uploadFile>>;
  try {
    uploaded = await Taro.cloud.uploadFile({
      cloudPath: result.data.uploadPath,
      filePath: file.tempFilePath,
    });
  } catch {
    throw new Error('图片上传失败，请重试');
  }
  const completed = await Taro.cloud.callFunction({
    name: 'api',
    data: {
      method: 'PATCH',
      path: `/v1/clothing/${result.data.clothing.id}/source`,
      body: {
        fileId: uploaded.fileID,
        expectedVersion: result.data.clothing.version,
      },
    },
  });
  if (isFailure(completed.result))
    throw new Error(completed.result.error.message);
  if (!isClothingEnvelope(completed.result))
    throw new Error('上传确认失败，请稍后重试');
  return {
    clothing: completed.result.data,
    uploadPath: result.data.uploadPath,
  };
}

export async function startCutoutJob(
  clothingId: string,
  expectedVersion: number,
): Promise<CutoutJob> {
  return callCutoutApi({
    method: 'POST',
    path: '/v1/image-processing/jobs',
    body: { clothingId, expectedVersion },
  });
}

export async function retryCutoutJob(
  jobId: string,
  expectedVersion: number,
): Promise<CutoutJob> {
  return callCutoutApi({
    method: 'POST',
    path: `/v1/image-processing/jobs/${jobId}/retry`,
    body: { expectedVersion },
  });
}

export async function confirmCutoutJob(
  jobId: string,
  expectedVersion: number,
): Promise<PublicClothing> {
  const result = (
    await Taro.cloud.callFunction({
      name: 'api',
      data: {
        method: 'POST',
        path: `/v1/image-processing/jobs/${jobId}/confirm`,
        body: { expectedVersion },
      },
    })
  ).result;
  if (isFailure(result)) throw new Error(result.error.message);
  if (
    !isPublicClothingEnvelope(result) ||
    result.data.processingStatus !== 'ready'
  )
    throw new Error('确认入库响应异常，请稍后重试');
  return result.data;
}

export async function listClothing(): Promise<PublicClothing[]> {
  const result = (
    await Taro.cloud.callFunction({
      name: 'api',
      data: { method: 'GET', path: '/v1/clothing' },
    })
  ).result;
  if (isFailure(result)) throw new Error(result.error.message);
  if (
    !isRecord(result) ||
    !isRecord(result.data) ||
    !Array.isArray(result.data.items) ||
    !result.data.items.every(isPublicClothing)
  )
    throw new Error('衣橱加载失败，请稍后重试');
  return result.data.items.filter((item) => item.processingStatus === 'ready');
}

export async function pollCutoutJob(
  jobId: string,
  options: {
    intervalMs?: number;
    maxPolls?: number;
    cancellation?: PollCancellation;
  } = {},
): Promise<CutoutJob> {
  const intervalMs = options.intervalMs ?? 1000;
  const maxPolls = options.maxPolls ?? 12;
  for (let attempt = 0; attempt < maxPolls; attempt += 1) {
    if (options.cancellation?.cancelled) throw new Error('抠图查询已取消');
    const job = await callCutoutApi({
      method: 'GET',
      path: `/v1/image-processing/jobs/${jobId}`,
    });
    if (job.status === 'succeeded' || job.status === 'failed') return job;
    if (attempt + 1 < maxPolls && intervalMs > 0)
      await delay(intervalMs, options.cancellation);
  }
  throw new Error('处理时间较长，请稍后重试查询');
}

async function callCutoutApi(
  data: Record<string, unknown>,
): Promise<CutoutJob> {
  let result: unknown;
  try {
    result = (await Taro.cloud.callFunction({ name: 'api', data })).result;
  } catch {
    throw new Error('智能抠图连接失败，请稍后重试');
  }
  if (isFailure(result)) throw new Error(result.error.message);
  if (!isCutoutJobEnvelope(result))
    throw new Error('智能抠图响应异常，请稍后重试');
  return result.data;
}

function delay(
  milliseconds: number,
  cancellation?: PollCancellation,
): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (cancellation?.cancelled) reject(new Error('抠图查询已取消'));
      else resolve();
    }, milliseconds);
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
function isFailure(value: unknown): value is { error: { message: string } } {
  return (
    isRecord(value) &&
    isRecord(value.error) &&
    typeof value.error.message === 'string'
  );
}
function isUploadResult(
  value: unknown,
): value is { data: { clothing: ClothingDraft; uploadPath: string } } {
  if (
    !isRecord(value) ||
    !isRecord(value.data) ||
    !isRecord(value.data.clothing)
  )
    return false;
  return (
    typeof value.data.uploadPath === 'string' &&
    typeof value.data.clothing.id === 'string' &&
    value.data.clothing.processingStatus === 'draft'
  );
}
function isClothingEnvelope(value: unknown): value is { data: ClothingDraft } {
  return (
    isRecord(value) &&
    isRecord(value.data) &&
    typeof value.data.id === 'string' &&
    value.data.processingStatus === 'draft'
  );
}
function isPublicClothingEnvelope(
  value: unknown,
): value is { data: PublicClothing } {
  return isRecord(value) && isPublicClothing(value.data);
}
function isPublicClothing(value: unknown): value is PublicClothing {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.color === 'string' &&
    ['top', 'bottom', 'shoes', 'accessory'].includes(String(value.category)) &&
    ['draft', 'processing', 'review', 'ready', 'failed'].includes(
      String(value.processingStatus),
    ) &&
    typeof value.version === 'number'
  );
}
function isCutoutJobEnvelope(value: unknown): value is { data: CutoutJob } {
  if (!isRecord(value) || !isRecord(value.data)) return false;
  return (
    typeof value.data.id === 'string' &&
    typeof value.data.clothingId === 'string' &&
    ['queued', 'processing', 'succeeded', 'failed'].includes(
      String(value.data.status),
    ) &&
    typeof value.data.attempts === 'number' &&
    typeof value.data.version === 'number'
  );
}
