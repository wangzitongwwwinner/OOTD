import { Button, Input, Picker, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect, useState } from 'react';

import { useOptionalAuth } from '../auth/AuthGate';
import type { PublicClothing } from '../wardrobe/clothing-service';
import type { OutfitNode } from './outfit-model';
import {
  outfitService,
  type CreateOutfitInput,
  type SavedOutfit,
} from './outfit-service';
import { SavedOutfitLookbook } from './SavedOutfitLookbook';
import { GUEST_OUTFITS } from './guest-outfit';

interface OutfitManagerService {
  create(input: CreateOutfitInput): Promise<SavedOutfit>;
  list(): Promise<SavedOutfit[]>;
  delete?(id: string, expectedVersion: number): Promise<void>;
}

interface OutfitManagerProps {
  nodes: OutfitNode[];
  onLoad(nodes: OutfitNode[]): void;
  refreshKey?: number;
  service?: OutfitManagerService;
  mode?: 'all' | 'save' | 'list';
  onSaved?(): void;
  clothing?: PublicClothing[];
  canvasSize?: { w: number; h: number };
  onGuestAuthenticated?(): Promise<boolean>;
}

export function OutfitManager({
  nodes,
  onLoad,
  refreshKey = 0,
  service = outfitService,
  mode = 'all',
  onSaved,
  clothing = [],
  canvasSize,
  onGuestAuthenticated,
}: OutfitManagerProps) {
  const auth = useOptionalAuth();
  const isGuest = Boolean(auth && auth.status !== 'authenticated');
  const [name, setName] = useState('');
  const [seasonTagsText, setSeasonTagsText] = useState('');
  const [colorTagsText, setColorTagsText] = useState('');
  const [items, setItems] = useState<SavedOutfit[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const colors = [
    '白色',
    '黑色',
    '蓝色',
    '灰色',
    '绿色',
    '棕色',
    '卡其色',
    '米色',
  ];

  useEffect(() => {
    if (mode === 'save' || isGuest) return;
    let active = true;
    void service
      .list()
      .then((outfits) => {
        if (active) setItems(outfits);
      })
      .catch((cause: unknown) => {
        if (active)
          setMessage(
            cause instanceof Error ? cause.message : '搭配加载失败，请重试',
          );
      });
    return () => {
      active = false;
    };
  }, [isGuest, mode, refreshKey, service]);

  async function handleSave() {
    if (saving) return;
    if (nodes.length === 0) {
      setMessage('请先添加至少一件衣物');
      return;
    }
    if (!name.trim()) {
      setMessage('请填写搭配名称');
      return;
    }

    if (isGuest && auth) {
      auth.requestLogin({
        title: '\u767b\u5f55\u540e\u4fdd\u5b58\u4e2a\u4eba\u642d\u914d',
        description:
          '\u6e38\u5ba2\u793a\u4f8b\u8863\u7269\u4e0d\u4f1a\u5199\u5165\u8d26\u53f7\uff0c\u767b\u5f55\u540e\u5c06\u5207\u6362\u4e3a\u4e2a\u4eba\u8863\u6a71\u3002',
        action: async () => {
          const hasClothing = (await onGuestAuthenticated?.()) ?? false;
          setShowSaveModal(false);
          setMessage(
            hasClothing
              ? '\u5df2\u5207\u6362\u4e3a\u4e2a\u4eba\u8863\u6a71\uff0c\u8bf7\u4f7f\u7528\u4e2a\u4eba\u8863\u7269\u91cd\u65b0\u642d\u914d'
              : '\u8bf7\u5148\u5f55\u5165\u8863\u7269',
          );
        },
      });
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      const saved = await service.create({
        name: name.trim(),
        seasonTags: parseTags(seasonTagsText),
        colorTags: parseTags(colorTagsText),
        canvasVersion: 1,
        nodes: nodes.map(({ clothingId, x, y, scale, zIndex }) => ({
          clothingId,
          x,
          y,
          scale,
          rotation: 0,
          zIndex,
        })),
      });
      setItems((current) => [
        saved,
        ...current.filter((item) => item.id !== saved.id),
      ]);
      setMessage('搭配已保存');
      setShowSaveModal(false);
      onSaved?.();
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : '搭配保存失败，请重试',
      );
    } finally {
      setSaving(false);
    }
  }

  function openSaveModal() {
    if (nodes.length === 0) {
      setMessage('请先添加至少一件衣物');
      return;
    }
    setMessage('');
    if (!seasonTagsText) setSeasonTagsText('秋天');
    if (!colorTagsText) setColorTagsText('蓝色');
    setShowSaveModal(true);
  }

  function handleLoad(outfit: SavedOutfit) {
    onLoad(
      outfit.nodes.map((node, index) => ({
        id: `loaded_${outfit.id}_${index}`,
        clothingId: node.clothingId,
        x: node.x,
        y: node.y,
        scale: node.scale,
        zIndex: node.zIndex,
      })),
    );
    setName(outfit.name);
    setSeasonTagsText(outfit.seasonTags.join('，'));
    setColorTagsText(outfit.colorTags.join('，'));
    setMessage(`已载入「${outfit.name}」`);
  }

  async function handleDelete(outfit: SavedOutfit) {
    if (isGuest && auth) {
      auth.requestLogin({
        title: '\u767b\u5f55\u540e\u7ba1\u7406\u6211\u7684\u642d\u914d',
        description:
          '\u6e38\u5ba2\u9ed8\u8ba4\u642d\u914d\u4ec5\u7528\u4e8e\u4f53\u9a8c\uff0c\u767b\u5f55\u540e\u5c06\u663e\u793a\u60a8\u7684\u4e2a\u4eba\u642d\u914d\u3002',
        action: async () => {
          await onGuestAuthenticated?.();
          try {
            setItems(await service.list());
          } catch {
            setItems([]);
          }
        },
      });
      return;
    }
    if (!service.delete) return;
    const { confirm } = await Taro.showModal({
      title: '删除搭配',
      content: `确认删除「${outfit.name}」吗？`,
      confirmText: '删除',
      confirmColor: '#b42318',
    });
    if (!confirm) return;
    try {
      await service.delete(outfit.id, outfit.version);
      setItems((current) => current.filter((item) => item.id !== outfit.id));
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : '搭配删除失败，请重试',
      );
    }
  }

  return (
    <View className={`outfit-manager outfit-manager--${mode}`}>
      {mode !== 'list' ? (
        <View className="outfit-manager__save">
          {mode === 'save' ? (
            <Button
              className="outfit-manager__save-trigger"
              onClick={openSaveModal}
            >
              保存为我的推荐搭配
            </Button>
          ) : (
            <>
              <Text className="outfit-manager__title">保存搭配</Text>
              <Input
                value={name}
                placeholder="给搭配起个名字"
                maxlength={80}
                onInput={(event) => setName(event.detail.value)}
              />
              <Input
                value={seasonTagsText}
                placeholder="季节标签，用逗号分隔"
                maxlength={251}
                onInput={(event) => setSeasonTagsText(event.detail.value)}
              />
              <Input
                value={colorTagsText}
                placeholder="颜色标签，用逗号分隔"
                maxlength={251}
                onInput={(event) => setColorTagsText(event.detail.value)}
              />
              <Button disabled={saving} loading={saving} onClick={handleSave}>
                保存搭配
              </Button>
            </>
          )}
          {message && !showSaveModal ? (
            <Text className="outfit-manager__message">{message}</Text>
          ) : null}
          {showSaveModal ? (
            <View className="outfit-save-modal__mask">
              <View className="outfit-save-modal">
                <View className="outfit-save-modal__heading">
                  <Text>保存搭配创意</Text>
                  <Button
                    aria-label="关闭保存弹层"
                    onClick={() => setShowSaveModal(false)}
                  >
                    ×
                  </Button>
                </View>
                <Text className="outfit-save-modal__label">搭配名称</Text>
                <Input
                  value={name}
                  placeholder={
                    isNameFocused ? '' : '如：秋日复古通勤、夏日空调房搭配'
                  }
                  maxlength={80}
                  onFocus={() => setIsNameFocused(true)}
                  onBlur={() => setIsNameFocused(false)}
                  onInput={(event) => {
                    setName(event.detail.value);
                    if (message === '请填写搭配名称') setMessage('');
                  }}
                />
                {message ? (
                  <Text className="outfit-save-modal__message">{message}</Text>
                ) : null}
                <Text className="outfit-save-modal__label">适用季节</Text>
                <View className="outfit-save-modal__seasons">
                  {['春天', '夏天', '秋天', '冬天'].map((season) => (
                    <Button
                      key={season}
                      className={seasonTagsText === season ? 'is-active' : ''}
                      onClick={() => setSeasonTagsText(season)}
                    >
                      {season}
                    </Button>
                  ))}
                </View>
                <Text className="outfit-save-modal__label">色系标签</Text>
                <Picker
                  mode="selector"
                  range={colors}
                  value={Math.max(0, colors.indexOf(colorTagsText))}
                  onChange={(event) =>
                    setColorTagsText(
                      colors[Number(event.detail.value)] ?? '蓝色',
                    )
                  }
                >
                  <View className="outfit-save-modal__color">
                    <Text>{colorTagsText}</Text>
                    <Text>⌄</Text>
                  </View>
                </Picker>
                <View className="outfit-save-modal__actions">
                  <Button onClick={() => setShowSaveModal(false)}>取消</Button>
                  <Button
                    loading={saving}
                    disabled={saving}
                    onClick={handleSave}
                  >
                    确认保存搭配
                  </Button>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {mode !== 'save' ? (
        <View className="outfit-manager__list">
          <SavedOutfitLookbook
            outfits={isGuest ? [...GUEST_OUTFITS] : items}
            clothing={clothing}
            canvasSize={canvasSize}
            onLoad={handleLoad}
            onDelete={
              service.delete
                ? (outfit) => {
                    void handleDelete(outfit);
                  }
                : undefined
            }
          />
        </View>
      ) : null}
    </View>
  );
}

function parseTags(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[,，]/)
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0 && tag.length <= 20),
    ),
  ).slice(0, 12);
}
