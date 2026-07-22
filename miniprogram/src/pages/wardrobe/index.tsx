import Taro from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
import { useEffect, useRef, useState } from 'react';

import { AuthenticatedPage } from '../../features/auth/AuthenticatedPage';
import { WardrobeUploader } from '../../features/wardrobe/WardrobeUploader';
import {
  ensureMediaSourceAccess,
  mediaSelectionErrorMessage,
  pollCutoutJob,
  retryCutoutJob,
  startCutoutJob,
  uploadClothingSource,
  type ClothingDraft,
  type CutoutJob,
} from '../../features/wardrobe/clothing-service';

import './index.scss';

export default function WardrobePage() {
  const [status, setStatus] = useState<
    | 'idle'
    | 'uploading'
    | 'uploaded'
    | 'failed'
    | 'processing'
    | 'succeeded'
    | 'cutout_failed'
  >('idle');
  const [error, setError] = useState<string>();
  const [sourcePreview, setSourcePreview] = useState<string>();
  const [processedFileId, setProcessedFileId] = useState<string>();
  const [clothing, setClothing] = useState<ClothingDraft>();
  const [job, setJob] = useState<CutoutJob>();
  const polling = useRef<AbortController>();

  useEffect(() => () => polling.current?.abort(), []);

  async function waitForJob(nextJob: CutoutJob) {
    polling.current?.abort();
    const controller = new AbortController();
    polling.current = controller;
    setJob(nextJob);
    setStatus('processing');
    const completed = await pollCutoutJob(nextJob.id, {
      signal: controller.signal,
    });
    setJob(completed);
    if (completed.status === 'succeeded' && completed.processedFileId) {
      setProcessedFileId(completed.processedFileId);
      setStatus('succeeded');
    } else {
      setError(completed.message ?? '智能抠图失败，请重试');
      setStatus('cutout_failed');
    }
  }

  async function chooseAndUpload(source: 'camera' | 'album') {
    try {
      await ensureMediaSourceAccess(source);
      const selection = await Taro.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: [source],
      });
      const file = selection.tempFiles[0];
      if (!file) return;
      polling.current?.abort();
      setStatus('uploading');
      setError(undefined);
      setSourcePreview(file.tempFilePath);
      setProcessedFileId(undefined);
      const uploaded = await uploadClothingSource(
        { tempFilePath: file.tempFilePath, size: file.size },
        { name: '新衣物', category: 'top', color: '待补充' },
      );
      setClothing(uploaded.clothing);
      setStatus('uploaded');
      const started = await startCutoutJob(
        uploaded.clothing.id,
        uploaded.clothing.version,
      );
      await waitForJob(started);
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : '';
      const message = /^chooseMedia:/i.test(detail)
        ? mediaSelectionErrorMessage(cause)
        : detail || '图片上传失败，请重试';
      if (!message) return;
      setError(message);
      setStatus('failed');
    }
  }

  async function retryProcessing() {
    try {
      setError(undefined);
      if (job?.status === 'processing') return await waitForJob(job);
      if (job?.status === 'failed')
        return await waitForJob(await retryCutoutJob(job.id, job.version));
      if (clothing)
        return await waitForJob(
          await startCutoutJob(clothing.id, clothing.version),
        );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '智能抠图失败，请重试');
      setStatus('cutout_failed');
    }
  }

  return (
    <AuthenticatedPage>
      <View className="wardrobe-page">
        <Text className="wardrobe-page__eyebrow">WARDROBE</Text>
        <Text className="wardrobe-page__title">我的衣橱</Text>
        <WardrobeUploader
          status={status}
          error={error}
          sourcePreview={sourcePreview}
          processedFileId={processedFileId}
          onChoose={(source) => void chooseAndUpload(source)}
          onRetry={() => void retryProcessing()}
        />
      </View>
    </AuthenticatedPage>
  );
}
