import { Button, Image, Picker, Text, View } from '@tarojs/components';
import { useMemo, useState } from 'react';

import type { PublicClothing } from '../wardrobe/clothing-service';
import { CLOTHING_NODE_SIZE } from './outfit-model';
import type { SavedOutfit } from './outfit-service';

const seasons = ['全部', '春天', '夏天', '秋天', '冬天'];
const previewSize = { w: 96, h: 128 };

export function getPreviewNodeLayout(
  node: { x: number; y: number; scale: number },
  canvasSize: { w: number; h: number },
  targetSize: { w: number; h: number },
): { left: number; top: number; size: number; scale: number } {
  const sourceWidth = Math.max(CLOTHING_NODE_SIZE + 1, canvasSize.w);
  const sourceHeight = Math.max(CLOTHING_NODE_SIZE + 1, canvasSize.h);
  const fitScale = Math.min(
    targetSize.w / sourceWidth,
    targetSize.h / sourceHeight,
  );
  const offsetX = (targetSize.w - sourceWidth * fitScale) / 2;
  const offsetY = (targetSize.h - sourceHeight * fitScale) / 2;
  return {
    left: offsetX + node.x * (sourceWidth - CLOTHING_NODE_SIZE) * fitScale,
    top: offsetY + node.y * (sourceHeight - CLOTHING_NODE_SIZE) * fitScale,
    size: CLOTHING_NODE_SIZE * fitScale,
    scale: node.scale,
  };
}

export function filterSavedOutfits(
  outfits: SavedOutfit[],
  season: string,
  color: string,
): SavedOutfit[] {
  return outfits.filter(
    (outfit) =>
      (season === '全部' || outfit.seasonTags.includes(season)) &&
      (color === '全部' || outfit.colorTags.includes(color)),
  );
}

export function SavedOutfitLookbook({
  outfits,
  clothing,
  canvasSize = { w: 200, h: 360 },
  onLoad,
  onDelete,
}: {
  outfits: SavedOutfit[];
  clothing: PublicClothing[];
  canvasSize?: { w: number; h: number };
  onLoad(outfit: SavedOutfit): void;
  onDelete?(outfit: SavedOutfit): void;
}) {
  const [season, setSeason] = useState('全部');
  const [color, setColor] = useState('全部');
  const colors = useMemo(
    () => [
      '全部',
      ...Array.from(new Set(outfits.flatMap((outfit) => outfit.colorTags))),
    ],
    [outfits],
  );
  const filtered = filterSavedOutfits(outfits, season, color);

  function findClothing(clothingId: string) {
    return clothing.find((item) => item.id === clothingId);
  }

  return (
    <View className="outfit-lookbook">
      <View className="outfit-lookbook__filters">
        <Picker
          mode="selector"
          range={seasons}
          value={Math.max(0, seasons.indexOf(season))}
          onChange={(event) =>
            setSeason(seasons[Number(event.detail.value)] ?? '全部')
          }
        >
          <View className="outfit-lookbook__filter">
            <Text>季节: {season}</Text>
            <Text>⌄</Text>
          </View>
        </Picker>
        <Picker
          mode="selector"
          range={colors}
          value={Math.max(0, colors.indexOf(color))}
          onChange={(event) =>
            setColor(colors[Number(event.detail.value)] ?? '全部')
          }
        >
          <View className="outfit-lookbook__filter">
            <Text>色系: {color}</Text>
            <Text>⌄</Text>
          </View>
        </Picker>
      </View>

      {filtered.length === 0 ? (
        <Text className="outfit-lookbook__empty">
          暂无保存的搭配。可以前往“试衣间”拼凑衣服并保存哦。
        </Text>
      ) : (
        <View className="outfit-lookbook__list">
          {filtered.map((outfit) => (
            <View className="outfit-lookbook__card" key={outfit.id}>
              <View className="outfit-lookbook__preview">
                {outfit.nodes.map((node, index) => {
                  const garment = findClothing(node.clothingId);
                  if (!garment) return null;
                  const layout = getPreviewNodeLayout(
                    node,
                    canvasSize,
                    previewSize,
                  );
                  return (
                    <View
                      className="outfit-lookbook__preview-node"
                      key={`${outfit.id}_${node.clothingId}_${index}`}
                      data-testid={`outfit-garment-${outfit.id}-${node.clothingId}`}
                      style={{
                        left: `${layout.left}px`,
                        top: `${layout.top}px`,
                        width: `${layout.size}px`,
                        height: `${layout.size}px`,
                        zIndex: node.zIndex,
                        transform: `scale(${layout.scale})`,
                      }}
                    >
                      <Image
                        src={garment.processedFileId ?? garment.sourceFileId}
                        mode="aspectFit"
                      />
                    </View>
                  );
                })}
              </View>

              <View className="outfit-lookbook__content">
                <View>
                  <Text className="outfit-lookbook__name">{outfit.name}</Text>
                  <Text className="outfit-lookbook__date">
                    创建于 {formatOutfitDate(outfit.createdAt)}
                  </Text>
                  <View className="outfit-lookbook__thumbnails">
                    {outfit.nodes.map((node, index) => {
                      const garment = findClothing(node.clothingId);
                      if (!garment) return null;
                      return (
                        <View
                          className="outfit-lookbook__thumbnail"
                          key={`${outfit.id}_thumb_${node.clothingId}_${index}`}
                          data-testid={`outfit-garment-${outfit.id}-${node.clothingId}`}
                        >
                          <Image
                            src={
                              garment.processedFileId ?? garment.sourceFileId
                            }
                            mode="aspectFit"
                          />
                        </View>
                      );
                    })}
                  </View>
                  <View className="outfit-lookbook__tags">
                    {outfit.seasonTags.map((tag) => (
                      <Text
                        className="outfit-lookbook__tag outfit-lookbook__tag--season"
                        key={`season_${tag}`}
                      >
                        {tag}
                      </Text>
                    ))}
                    {outfit.colorTags.map((tag) => (
                      <Text
                        className="outfit-lookbook__tag outfit-lookbook__tag--color"
                        key={`color_${tag}`}
                      >
                        {tag}
                      </Text>
                    ))}
                  </View>
                </View>
                <View className="outfit-lookbook__actions">
                  <Button
                    aria-label={`载入编辑 ${outfit.name}`}
                    onClick={() => onLoad(outfit)}
                  >
                    载入编辑
                  </Button>
                  {onDelete ? (
                    <Button
                      aria-label={`删除 ${outfit.name}`}
                      onClick={() => onDelete(outfit)}
                    >
                      删除
                    </Button>
                  ) : null}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function formatOutfitDate(value: string): string {
  const date = value.slice(0, 10).split('-');
  return date.length === 3 ? date.join('.') : value;
}
