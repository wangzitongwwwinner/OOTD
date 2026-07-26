import Taro from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
import { useEffect, useRef, useState } from 'react';

import { AuthenticatedPage } from '../../features/auth/AuthenticatedPage';
import { WardrobeUploader } from '../../features/wardrobe/WardrobeUploader';
import { WardrobeBrowser } from '../../features/wardrobe/WardrobeBrowser';
import {
  confirmCutoutJob,
  deleteClothing,
  ensureMediaSourceAccess,
  listClothing,
  mediaSelectionErrorMessage,
  pollCutoutJob,
  retryCutoutJob,
  startCutoutJob,
  uploadClothingSource,
  type ClothingDraft,
  type CutoutJob,
  type PollCancellation,
  type PublicClothing,
  ReferencedClothingError,
} from '../../features/wardrobe/clothing-service';

import './index.scss';

export default function WardrobePage() {
  const [status, setStatus] = useState<
    | 'idle'
    | 'uploading'
    | 'uploaded'
    | 'failed'
    | 'processing'
    | 'confirming'
    | 'succeeded'
    | 'cutout_failed'
  >('idle');
  const [error, setError] = useState<string>();
  const [sourcePreview, setSourcePreview] = useState<string>();
  const [processedFileId, setProcessedFileId] = useState<string>();
  const [clothing, setClothing] = useState<ClothingDraft>();
  const [job, setJob] = useState<CutoutJob>();
  const [items, setItems] = useState<PublicClothing[]>([]);
  const [listError, setListError] = useState<string>();
  const polling = useRef<PollCancellation>();

  useEffect(
    () => () => {
      if (polling.current) polling.current.cancelled = true;
    },
    [],
  );
  useEffect(() => {
    let active = true;
    void listClothing()
      .then((result) => {
        if (active) setItems(result);
      })
      .catch((cause) => {
        if (active)
          setListError(
            cause instanceof Error ? cause.message : '衣橱加载失败，请重试',
          );
      });
    return () => {
      active = false;
    };
  }, []);

  async function waitForJob(nextJob: CutoutJob) {
    if (polling.current) polling.current.cancelled = true;
    const cancellation: PollCancellation = { cancelled: false };
    polling.current = cancellation;
    setJob(nextJob);
    setStatus('processing');
    const completed = await pollCutoutJob(nextJob.id, {
      cancellation,
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
      if (polling.current) polling.current.cancelled = true;
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
      if (detail === '抠图查询已取消') return;
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

  async function confirmProcessing() {
    if (!job || job.status !== 'succeeded') return;
    try {
      setStatus('confirming');
      const confirmed = await confirmCutoutJob(job.id, job.version);
      setItems((current) => [
        confirmed,
        ...current.filter((item) => item.id !== confirmed.id),
      ]);
      resetUploader();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '确认入库失败，请重试');
      setStatus('succeeded');
    }
  }

  async function handleDelete(clothingId: string, expectedVersion: number) {
    try {
      await deleteClothing(clothingId, expectedVersion);
      setItems((current) => current.filter((item) => item.id !== clothingId));
    } catch (cause) {
      if (cause instanceof ReferencedClothingError) {
        const modal = await Taro.showModal({
          title: '衣物已用于搭配',
          content: `${cause.message}。删除后，已保存搭配中的这件衣物也会被移除。`,
          confirmText: '确认删除',
          confirmColor: '#b42318',
          cancelText: '取消',
        });
        if (!modal.confirm) return;
        try {
          await deleteClothing(clothingId, expectedVersion, true);
          setItems((current) =>
            current.filter((item) => item.id !== clothingId),
          );
          return;
        } catch (confirmedCause) {
          setListError(
            confirmedCause instanceof Error
              ? confirmedCause.message
              : '删除失败，请重试',
          );
          return;
        }
      }
      setListError(cause instanceof Error ? cause.message : '删除失败，请重试');
    }
  }

  function resetUploader() {
    if (polling.current) polling.current.cancelled = true;
    setStatus('idle');
    setError(undefined);
    setSourcePreview(undefined);
    setProcessedFileId(undefined);
    setClothing(undefined);
    setJob(undefined);
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
          onConfirm={() => void confirmProcessing()}
          onRetake={resetUploader}
        />
        {listError ? (
          <Text className="wardrobe-page__error">{listError}</Text>
        ) : null}
        <WardrobeBrowser
          items={items}
          onUpdate={(updated) =>
            setItems((current) =>
              current.map((i) => (i.id === updated.id ? updated : i)),
            )
          }
          onDelete={(id, version) => void handleDelete(id, version)}
        />
      </View>
    </AuthenticatedPage>
  );
}
