import Taro from '@tarojs/taro';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ensureMediaSourceAccess,
  mediaSelectionErrorMessage,
  pollCutoutJob,
  retryCutoutJob,
  startCutoutJob,
  uploadClothingSource,
  validateClothingImage,
} from './clothing-service';

describe('clothing service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('拒绝非 JPG/PNG 或超过 10 MB 的原图', () => {
    expect(() =>
      validateClothingImage({ tempFilePath: '/tmp/a.gif', size: 100 }),
    ).toThrow('JPG 或 PNG');
    expect(() =>
      validateClothingImage({
        tempFilePath: '/tmp/a.jpg',
        size: 10 * 1024 * 1024 + 1,
      }),
    ).toThrow('10 MB');
  });

  it('将权限拒绝和选择失败映射为可操作提示', () => {
    expect(
      mediaSelectionErrorMessage(new Error('chooseMedia:fail auth deny')),
    ).toBe('无法访问相机或相册，请在设置中允许后重试');
    expect(
      mediaSelectionErrorMessage(new Error('chooseMedia:fail cancel')),
    ).toBeUndefined();
    expect(mediaSelectionErrorMessage(new Error('unexpected'))).toBe(
      '图片选择失败，请重试',
    );
  });

  it('拍照前显式申请相机权限，相册选择不申请无关权限', async () => {
    vi.mocked(Taro.getSetting).mockResolvedValue({ authSetting: {} } as never);
    vi.mocked(Taro.authorize).mockResolvedValue({} as never);

    await ensureMediaSourceAccess('camera');
    expect(Taro.authorize).toHaveBeenCalledWith({ scope: 'scope.camera' });

    vi.clearAllMocks();
    await ensureMediaSourceAccess('album');
    expect(Taro.getSetting).not.toHaveBeenCalled();
    expect(Taro.authorize).not.toHaveBeenCalled();
  });

  it('相机权限拒绝时返回设置引导而不暴露内部错误', async () => {
    vi.mocked(Taro.getSetting).mockResolvedValue({ authSetting: {} } as never);
    vi.mocked(Taro.authorize).mockRejectedValue(
      new Error('authorize:fail auth deny'),
    );
    await expect(ensureMediaSourceAccess('camera')).rejects.toThrow(
      '无法访问相机，请在设置中允许后重试',
    );
  });

  it('先初始化可信草稿，再上传到服务端生成的隔离路径', async () => {
    vi.mocked(Taro.cloud.callFunction)
      .mockResolvedValueOnce({
        result: {
          data: {
            clothing: {
              id: 'clothing_1',
              name: '白色 T 恤',
              category: 'top',
              color: '白色',
              sourceFileId: 'clothing-sources/user_1/clothing_1.jpg',
              processingStatus: 'draft',
              createdAt: '2026-07-22T08:00:00.000Z',
              updatedAt: '2026-07-22T08:00:00.000Z',
              version: 1,
            },
            uploadPath: 'clothing-sources/user_1/clothing_1.jpg',
          },
          requestId: 'req_upload',
        },
      } as never)
      .mockResolvedValueOnce({
        result: {
          data: {
            id: 'clothing_1',
            name: '白色 T 恤',
            category: 'top',
            color: '白色',
            sourceFileId: 'cloud://env/clothing-sources/user_1/clothing_1.jpg',
            processingStatus: 'draft',
            createdAt: '2026-07-22T08:00:00.000Z',
            updatedAt: '2026-07-22T08:01:00.000Z',
            version: 2,
          },
          requestId: 'req_complete',
        },
      } as never);
    vi.mocked(Taro.cloud.uploadFile).mockResolvedValue({
      fileID: 'cloud://env/clothing-sources/user_1/clothing_1.jpg',
      statusCode: 200,
    } as never);

    const result = await uploadClothingSource(
      { tempFilePath: '/tmp/source.jpg', size: 2048 },
      { name: '白色 T 恤', category: 'top', color: '白色' },
    );

    expect(Taro.cloud.callFunction).toHaveBeenCalledWith({
      name: 'api',
      data: {
        method: 'POST',
        path: '/v1/clothing/uploads',
        body: {
          name: '白色 T 恤',
          category: 'top',
          color: '白色',
          extension: 'jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 2048,
        },
      },
    });
    expect(Taro.cloud.uploadFile).toHaveBeenCalledWith({
      cloudPath: 'clothing-sources/user_1/clothing_1.jpg',
      filePath: '/tmp/source.jpg',
    });
    expect(Taro.cloud.callFunction).toHaveBeenLastCalledWith({
      name: 'api',
      data: {
        method: 'PATCH',
        path: '/v1/clothing/clothing_1/source',
        body: {
          fileId: 'cloud://env/clothing-sources/user_1/clothing_1.jpg',
          expectedVersion: 1,
        },
      },
    });
    expect(result.clothing.id).toBe('clothing_1');
  });

  it('云存储上传失败时返回友好提示', async () => {
    vi.mocked(Taro.cloud.callFunction).mockResolvedValueOnce({
      result: {
        data: {
          clothing: { id: 'clothing_1', processingStatus: 'draft', version: 1 },
          uploadPath: 'clothing-sources/user_1/clothing_1.jpg',
        },
        requestId: 'req_upload',
      },
    } as never);
    vi.mocked(Taro.cloud.uploadFile).mockRejectedValueOnce(
      new Error('uploadFile:fail internal code'),
    );
    await expect(
      uploadClothingSource(
        { tempFilePath: '/tmp/source.jpg', size: 2048 },
        { name: '新衣物', category: 'top', color: '待补充' },
      ),
    ).rejects.toThrow('图片上传失败，请重试');
  });

  it('创建任务并轮询到抠图成功', async () => {
    const processing = {
      id: 'cutout_1',
      clothingId: 'clothing_1',
      status: 'processing',
      attempts: 1,
      createdAt: '2026-07-22T08:00:00.000Z',
      updatedAt: '2026-07-22T08:00:00.000Z',
      version: 1,
    };
    vi.mocked(Taro.cloud.callFunction)
      .mockResolvedValueOnce({
        result: { data: processing, requestId: 'req_start' },
      } as never)
      .mockResolvedValueOnce({
        result: { data: processing, requestId: 'req_poll_1' },
      } as never)
      .mockResolvedValueOnce({
        result: {
          data: {
            ...processing,
            status: 'succeeded',
            processedFileId: 'cloud://processed.png',
            version: 2,
          },
          requestId: 'req_poll_2',
        },
      } as never);

    const job = await startCutoutJob('clothing_1', 2);
    const result = await pollCutoutJob(job.id, { intervalMs: 0, maxPolls: 3 });
    expect(result.status).toBe('succeeded');
    expect(result.processedFileId).toBe('cloud://processed.png');
  });

  it('失败任务按当前版本显式重试', async () => {
    vi.mocked(Taro.cloud.callFunction).mockResolvedValueOnce({
      result: {
        data: {
          id: 'cutout_1',
          clothingId: 'clothing_1',
          status: 'processing',
          attempts: 2,
          createdAt: '2026-07-22T08:00:00.000Z',
          updatedAt: '2026-07-22T08:02:00.000Z',
          version: 3,
        },
        requestId: 'req_retry',
      },
    } as never);
    const result = await retryCutoutJob('cutout_1', 2);
    expect(Taro.cloud.callFunction).toHaveBeenCalledWith({
      name: 'api',
      data: {
        method: 'POST',
        path: '/v1/image-processing/jobs/cutout_1/retry',
        body: { expectedVersion: 2 },
      },
    });
    expect(result.attempts).toBe(2);
  });
});
