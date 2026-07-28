import { Button, Image, Input, Picker, Text, View } from '@tarojs/components';
import { useState } from 'react';

import type { ClothingCategory } from './clothing-service';

type Source = 'camera' | 'album';
export interface ClothingBasics {
  name: string;
  category: ClothingCategory;
  color: string;
}
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
  onChoose: (source: Source, basics: ClothingBasics) => void;
  onRetry?: () => void;
  onConfirm?: (basics: ClothingBasics) => void;
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
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ClothingCategory>('top');
  const [color, setColor] = useState('黑色');
  const busy =
    status === 'uploading' ||
    status === 'processing' ||
    status === 'confirming';
  const basics = { name: name.trim() || '未命名衣物', category, color };
  const categories: Array<{ value: ClothingCategory; label: string }> = [
    { value: 'top', label: '上装' },
    { value: 'bottom', label: '下装' },
    { value: 'shoes', label: '鞋履' },
    { value: 'accessory', label: '配饰' },
  ];
  const colors = [
    '黑色',
    '白色',
    '灰色',
    '蓝色',
    '绿色',
    '棕色',
    '卡其色',
    '米色',
  ];

  return (
    <View className="wardrobe-upload">
      <View className="wardrobe-upload__guide">
        <Text>
          💡 <Text className="wardrobe-upload__guide-title">拍照提示：</Text>
          将衣物平铺、使用与衣物颜色对比明显的背景，系统抠图效果将更完美。
        </Text>
      </View>
      <View className="wardrobe-upload__field">
        <Text>衣物名称</Text>
        <Input
          aria-label="衣物名称"
          value={name}
          maxlength={40}
          placeholder="如：黑色轻薄防晒衫、纯羊毛直筒裤"
          onInput={(event) => setName(event.detail.value)}
        />
      </View>
      <View className="wardrobe-upload__field">
        <Text>分类</Text>
        <View className="wardrobe-upload__categories">
          {categories.map((item) => (
            <Button
              key={item.value}
              className={category === item.value ? 'is-active' : ''}
              onClick={() => setCategory(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </View>
      </View>
      <View className="wardrobe-upload__field">
        <Text>主色调</Text>
        <Picker
          mode="selector"
          range={colors}
          value={Math.max(0, colors.indexOf(color))}
          onChange={(event) =>
            setColor(colors[Number(event.detail.value)] ?? '黑色')
          }
        >
          <View className="wardrobe-upload__color-picker">
            <Text>{color}</Text>
            <Text>⌄</Text>
          </View>
        </Picker>
      </View>
      {status === 'idle' || status === 'failed' ? (
        <>
          <Text className="wardrobe-upload__source-label">
            拍照或上传衣物原图
          </Text>
        </>
      ) : null}
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
              onClick={() => onConfirm?.(basics)}
            >
              {status === 'confirming' ? '正在入库…' : '确认入库'}
            </Button>
          </View>
        </View>
      ) : null}
      <View className="wardrobe-upload__actions">
        <Button
          className="wardrobe-upload__action--camera"
          disabled={busy}
          loading={busy}
          onClick={() => onChoose('camera', basics)}
        >
          {status === 'uploading'
            ? '正在上传…'
            : status === 'processing'
              ? '正在智能抠图…'
              : '拍照上传'}
        </Button>
        <Button
          className="wardrobe-upload__action--album"
          disabled={busy}
          onClick={() => onChoose('album', basics)}
        >
          相册选择
        </Button>
      </View>
    </View>
  );
}
