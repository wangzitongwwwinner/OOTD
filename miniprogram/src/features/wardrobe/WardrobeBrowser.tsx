import { Button, Image, Input, Picker, Text, View } from '@tarojs/components';
import { useMemo, useState } from 'react';

import type { ClothingCategory, PublicClothing } from './clothing-service';
import { filterClothing } from './wardrobe-filters';

const categories: Array<{ value: ClothingCategory | ''; label: string }> = [
  { value: '', label: '全部' },
  { value: 'top', label: '上装' },
  { value: 'bottom', label: '下装' },
  { value: 'shoes', label: '鞋履' },
  { value: 'accessory', label: '配饰' },
];

const categoryOptions = categories.slice(1) as Array<{
  value: ClothingCategory;
  label: string;
}>;

const categoryLabels = Object.fromEntries(
  categoryOptions.map((option) => [option.value, option.label]),
) as Record<ClothingCategory, string>;

export function WardrobeBrowser({
  items,
  onUpdate,
  onDelete,
}: {
  items: PublicClothing[];
  onUpdate?: (updated: PublicClothing) => void;
  onDelete?: (id: string, version: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ClothingCategory | ''>('');
  const [color, setColor] = useState('');

  const colors = useMemo(
    () => Array.from(new Set(items.map((item) => item.color))),
    [items],
  );
  const visible = filterClothing(items, { query, category, color });

  return (
    <View className="wardrobe-browser">
      <Text className="wardrobe-browser__title">已入库衣物</Text>
      <Input
        className="wardrobe-browser__search"
        aria-label="搜索衣物名称"
        placeholder="搜索衣物名称"
        value={query}
        onInput={(event) => setQuery(event.detail.value)}
      />
      <View className="wardrobe-browser__filters">
        {categories.map((option) => (
          <Button
            key={option.value || 'all'}
            className={category === option.value ? 'is-active' : ''}
            onClick={() => setCategory(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </View>
      <View className="wardrobe-browser__filters">
        <Button
          className={!color ? 'is-active' : ''}
          onClick={() => setColor('')}
        >
          全部颜色
        </Button>
        {colors.map((itemColor) => (
          <Button
            key={itemColor}
            className={color === itemColor ? 'is-active' : ''}
            onClick={() => setColor(itemColor)}
          >
            {itemColor}
          </Button>
        ))}
      </View>
      {visible.length === 0 ? (
        <Text className="wardrobe-browser__empty">暂无符合条件的衣物</Text>
      ) : (
        <View className="wardrobe-browser__grid">
          {visible.map((item) => (
            <WardrobeCard
              key={item.id}
              item={item}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function WardrobeCard({
  item,
  onUpdate,
  onDelete,
}: {
  item: PublicClothing;
  onUpdate?: (updated: PublicClothing) => void;
  onDelete?: (id: string, version: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState<ClothingCategory>(item.category);
  const [color, setColor] = useState(item.color);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!onUpdate || saving) return;
    setSaving(true);
    try {
      const { updateClothing } = await import('./clothing-service');
      const updated = await updateClothing(
        item.id,
        name.trim() || item.name,
        category,
        color.trim() || item.color,
        item.version,
      );
      onUpdate(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <View className="wardrobe-browser__card">
        <Image
          src={item.processedFileId ?? item.sourceFileId}
          mode="aspectFit"
        />
        <Text className="wardrobe-browser__card-name">{item.name}</Text>
        <View className="wardrobe-browser__tags">
          <Text className="wardrobe-browser__tag" data-testid="clothing-tag">
            {categoryLabels[item.category]}
          </Text>
          <Text className="wardrobe-browser__tag" data-testid="clothing-tag">
            {item.color}
          </Text>
        </View>
        {onUpdate || onDelete ? (
          <View className="wardrobe-browser__card-actions">
            {onUpdate ? (
              <Button
                className="wardrobe-browser__card-action wardrobe-browser__edit-btn"
                onClick={() => {
                  setName(item.name);
                  setCategory(item.category);
                  setColor(item.color);
                  setEditing(true);
                }}
              >
                编辑
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                className="wardrobe-browser__card-action wardrobe-browser__del-btn"
                onClick={() => onDelete(item.id, item.version)}
              >
                删除
              </Button>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View className="wardrobe-browser__card wardrobe-browser__card--editing">
      <Image src={item.processedFileId ?? item.sourceFileId} mode="aspectFit" />
      <Input
        className="wardrobe-browser__edit-input"
        aria-label="衣物名称"
        placeholder="衣物名称"
        value={name}
        onInput={(event) => setName(event.detail.value)}
      />
      <Picker
        mode="selector"
        range={categoryOptions}
        rangeKey="label"
        value={Math.max(
          0,
          categoryOptions.findIndex((o) => o.value === category),
        )}
        onChange={(event) => {
          const selected =
            categoryOptions[Number(event.detail.value)]?.value ?? 'top';
          setCategory(selected);
        }}
      >
        <View className="wardrobe-browser__picker">
          {categoryOptions.find((o) => o.value === category)?.label ?? '上装'}
        </View>
      </Picker>
      <Input
        className="wardrobe-browser__edit-input"
        aria-label="衣物颜色"
        placeholder="衣物颜色"
        value={color}
        onInput={(event) => setColor(event.detail.value)}
      />
      <View className="wardrobe-browser__edit-actions">
        <Button onClick={() => setEditing(false)}>取消</Button>
        <Button
          loading={saving}
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? '保存中…' : '保存'}
        </Button>
      </View>
    </View>
  );
}
