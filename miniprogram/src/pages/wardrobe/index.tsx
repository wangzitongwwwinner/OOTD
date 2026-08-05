import Taro from '@tarojs/taro';
import { Button, Image, ScrollView, Text, View } from '@tarojs/components';
import { useEffect, useRef, useState } from 'react';

import { useOptionalAuth } from '../../features/auth/AuthGate';
import { AuthenticatedPage } from '../../features/auth/AuthenticatedPage';
import { GUEST_CLOTHING } from '../../features/wardrobe/guest-clothing';
import { WardrobeUploader } from '../../features/wardrobe/WardrobeUploader';
import type { ClothingBasics } from '../../features/wardrobe/WardrobeUploader';
import { WardrobeBrowser } from '../../features/wardrobe/WardrobeBrowser';
import { WardrobeHeader } from '../../features/wardrobe/WardrobeHeader';
import { useSyncTabBar } from '../../custom-tab-bar/active-tab';
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
  updateClothing,
  type ClothingDraft,
  type CutoutJob,
  type PollCancellation,
  type PublicClothing,
  ReferencedClothingError,
} from '../../features/wardrobe/clothing-service';

import './index.scss';

export default function WardrobePage() {
  const auth = useOptionalAuth();
  const isGuest = Boolean(auth && auth.status !== 'authenticated');
  useSyncTabBar('wardrobe');
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
  const [showUploader, setShowUploader] = useState(false);
  const polling = useRef<PollCancellation>();

  useEffect(
    () => () => {
      if (polling.current) polling.current.cancelled = true;
    },
    [],
  );
  useEffect(() => {
    if (isGuest) return;
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
  }, [isGuest]);

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

  function chooseAndUpload(source: 'camera' | 'album', basics: ClothingBasics) {
    if (isGuest && auth) {
      auth.requestLogin({
        title:
          source === 'camera'
            ? '\u767b\u5f55\u540e\u62cd\u7167\u4e0a\u4f20'
            : '\u767b\u5f55\u540e\u4ece\u76f8\u518c\u9009\u62e9',
        description:
          '\u767b\u5f55\u6210\u529f\u540e\u5c06\u81ea\u52a8\u7ee7\u7eed\u539f\u56fe\u7247\u5165\u53e3\u3002',
        action: () => persistChooseAndUpload(source, basics),
      });
      return;
    }
    void persistChooseAndUpload(source, basics);
  }

  async function persistChooseAndUpload(
    source: 'camera' | 'album',
    basics: ClothingBasics,
  ) {
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
        basics,
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

  async function confirmProcessing(basics: ClothingBasics) {
    if (!job || job.status !== 'succeeded') return;
    try {
      setStatus('confirming');
      const confirmed = await confirmCutoutJob(job.id, job.version);
      const saved =
        confirmed.name === basics.name &&
        confirmed.category === basics.category &&
        confirmed.color === basics.color
          ? confirmed
          : await updateClothing(
              confirmed.id,
              basics.name,
              basics.category,
              basics.color,
              confirmed.version,
            );
      setItems((current) => [
        saved,
        ...current.filter((item) => item.id !== saved.id),
      ]);
      resetUploader();
      setShowUploader(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '确认入库失败，请重试');
      setStatus('succeeded');
    }
  }

  async function refreshPersonalClothing() {
    setListError(undefined);
    try {
      setItems(await listClothing());
    } catch (cause) {
      setListError(
        cause instanceof Error
          ? cause.message
          : '\u8863\u6a71\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5',
      );
    }
  }

  function handleDelete(clothingId: string, expectedVersion: number) {
    const item = (isGuest ? GUEST_CLOTHING : items).find(
      (entry) => entry.id === clothingId,
    );
    if (isGuest && auth) {
      auth.requestLogin({
        title: '\u767b\u5f55\u540e\u5220\u9664\u8863\u7269',
        description:
          '\u767b\u5f55\u6210\u529f\u540e\u5c06\u81ea\u52a8\u5220\u9664\u201c' +
          (item?.name ?? '') +
          '\u201d\u3002',
        action: refreshPersonalClothing,
      });
      return;
    }
    void persistDelete(clothingId, expectedVersion);
  }

  async function persistDelete(clothingId: string, expectedVersion: number) {
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

  async function handleSaveEdit(
    item: PublicClothing,
    input: {
      name: string;
      category: PublicClothing['category'];
      color: string;
    },
  ) {
    if (isGuest && auth) {
      auth.requestLogin({
        title: '\u767b\u5f55\u540e\u4fdd\u5b58\u8863\u7269\u4fee\u6539',
        description:
          '\u767b\u5f55\u6210\u529f\u540e\u5c06\u81ea\u52a8\u4fdd\u5b58\u5f53\u524d\u4fee\u6539\u3002',
        action: refreshPersonalClothing,
      });
      return undefined;
    }
    return updateClothing(
      item.id,
      input.name,
      input.category,
      input.color,
      item.version,
    );
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

  const displayedItems = isGuest ? [...GUEST_CLOTHING] : items;

  return (
    <AuthenticatedPage>
      <View className="wardrobe-page">
        <WardrobeHeader
          count={displayedItems.length}
          onAdd={() => setShowUploader(true)}
        />
        {showUploader ? (
          <View
            className="wardrobe-page__upload-backdrop"
            onClick={() => {
              if (status === 'uploading' || status === 'processing') return;
              resetUploader();
              setShowUploader(false);
            }}
          >
            <View
              className="wardrobe-page__upload-dialog"
              onClick={(event) => event.stopPropagation()}
            >
              <View className="wardrobe-page__upload-heading">
                <Text>智能衣物录入</Text>
                <Button
                  aria-label="关闭"
                  onClick={() => {
                    resetUploader();
                    setShowUploader(false);
                  }}
                >
                  <Image src="/assets/icons/close.svg" mode="aspectFit" />
                </Button>
              </View>
              <ScrollView
                className="wardrobe-page__upload-scroll"
                scrollY
                enhanced
                showScrollbar={false}
              >
                <WardrobeUploader
                  status={status}
                  error={error}
                  sourcePreview={sourcePreview}
                  processedFileId={processedFileId}
                  onChoose={(source, basics) =>
                    void chooseAndUpload(source, basics)
                  }
                  onRetry={() => void retryProcessing()}
                  onConfirm={(basics) => void confirmProcessing(basics)}
                  onRetake={resetUploader}
                />
              </ScrollView>
            </View>
          </View>
        ) : null}
        {listError ? (
          <Text className="wardrobe-page__error">{listError}</Text>
        ) : null}
        <WardrobeBrowser
          items={displayedItems}
          onSave={handleSaveEdit}
          onUpdate={(updated) =>
            setItems((current) =>
              current.map((i) => (i.id === updated.id ? updated : i)),
            )
          }
          onDelete={handleDelete}
        />
      </View>
    </AuthenticatedPage>
  );
}
