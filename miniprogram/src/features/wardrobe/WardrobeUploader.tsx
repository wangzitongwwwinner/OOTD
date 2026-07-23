import { Button, Image, Text, View } from '@tarojs/components';

type Source = 'camera' | 'album';
type Status =
  | 'idle'
  | 'uploading'
  | 'uploaded'
  | 'failed'
  | 'processing'
  | 'confirming'
  | 'succeeded'
  | 'cutout_failed';

interface Props {
  status: Status;
  error?: string;
  sourcePreview?: string;
  processedFileId?: string;
  onChoose: (source: Source) => void;
  onRetry?: () => void;
  onConfirm?: () => void;
  onRetake?: () => void;
}

export function WardrobeUploader({
  status,
  error,
  sourcePreview,
  processedFileId,
  onChoose,
  onRetry,
  onConfirm,
  onRetake,
}: Props) {
  const busy =
    status === 'uploading' ||
    status === 'processing' ||
    status === 'confirming';
  return (
    <View className="wardrobe-upload">
      <Text className="wardrobe-upload__eyebrow">ADD A PIECE</Text>
      <Text className="wardrobe-upload__title">录入一件衣物</Text>
      <View className="wardrobe-upload__guide">
        <Text className="wardrobe-upload__guide-title">拍摄指南</Text>
        <Text>将衣物平铺，使用纯色高对比背景，保持正面和光线均匀。</Text>
        <Text>支持 JPG、PNG，图片不超过 10 MB。</Text>
      </View>
      {status === 'failed' ? (
        <Text className="wardrobe-upload__error">{error}</Text>
      ) : null}
      {status === 'uploaded' ? (
        <Text className="wardrobe-upload__success">
          原图上传成功，等待智能抠图
        </Text>
      ) : null}
      {status === 'processing' ? (
        <Text className="wardrobe-upload__processing">正在智能抠图…</Text>
      ) : null}
      {status === 'cutout_failed' ? (
        <View>
          <Text className="wardrobe-upload__error">
            {error ?? '智能抠图失败，请重试'}
          </Text>
          <Button onClick={onRetry}>重新抠图</Button>
        </View>
      ) : null}
      {(status === 'succeeded' || status === 'confirming') &&
      sourcePreview &&
      processedFileId ? (
        <View>
          <View className="wardrobe-upload__comparison">
            <View aria-label="抠图前">
              <Text>抠图前</Text>
              <Image src={sourcePreview} mode="aspectFit" />
            </View>
            <View aria-label="抠图后">
              <Text>抠图后</Text>
              <Image src={processedFileId} mode="aspectFit" />
            </View>
          </View>
          <View className="wardrobe-upload__review-actions">
            <Button onClick={onRetake}>重新拍摄</Button>
            <Button
              loading={status === 'confirming'}
              disabled={status === 'confirming'}
              onClick={onConfirm}
            >
              {status === 'confirming' ? '正在入库…' : '确认入库'}
            </Button>
          </View>
        </View>
      ) : null}
      <View className="wardrobe-upload__actions">
        <Button
          disabled={busy}
          loading={busy}
          onClick={() => onChoose('camera')}
        >
          {status === 'uploading'
            ? '正在上传…'
            : status === 'processing'
              ? '正在智能抠图…'
              : '拍照上传'}
        </Button>
        <Button disabled={busy} onClick={() => onChoose('album')}>
          相册选择
        </Button>
      </View>
    </View>
  );
}
