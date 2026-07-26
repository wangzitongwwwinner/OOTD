import { Button, Input, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect, useState } from 'react';

import type { OutfitNode } from './outfit-model';
import {
  outfitService,
  type CreateOutfitInput,
  type SavedOutfit,
} from './outfit-service';

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
}

export function OutfitManager({
  nodes,
  onLoad,
  refreshKey = 0,
  service = outfitService,
}: OutfitManagerProps) {
  const [name, setName] = useState('');
  const [seasonTagsText, setSeasonTagsText] = useState('');
  const [colorTagsText, setColorTagsText] = useState('');
  const [items, setItems] = useState<SavedOutfit[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
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
  }, [refreshKey, service]);

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
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : '搭配保存失败，请重试',
      );
    } finally {
      setSaving(false);
    }
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
    <View className="outfit-manager">
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
      {message ? (
        <Text className="outfit-manager__message">{message}</Text>
      ) : null}

      <Text className="outfit-manager__title">我的搭配</Text>
      {items.length === 0 ? (
        <Text className="outfit-manager__empty">还没有保存的搭配</Text>
      ) : (
        items.map((item) => (
          <View className="outfit-manager__item" key={item.id}>
            <View className="outfit-manager__item-summary">
              <Text className="outfit-manager__item-name">{item.name}</Text>
              <Text className="outfit-manager__item-count">
                {item.nodes.length} 件衣物
              </Text>
              {item.seasonTags.length + item.colorTags.length > 0 ? (
                <View className="outfit-manager__tags">
                  {[...item.seasonTags, ...item.colorTags].map((tag) => (
                    <Text className="outfit-manager__tag" key={tag}>
                      {tag}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
            <Button
              aria-label={`载入 ${item.name}`}
              onClick={() => handleLoad(item)}
            >
              载入
            </Button>
            {service.delete ? (
              <Button
                aria-label={`删除 ${item.name}`}
                onClick={() => void handleDelete(item)}
              >
                删除
              </Button>
            ) : null}
          </View>
        ))
      )}
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
