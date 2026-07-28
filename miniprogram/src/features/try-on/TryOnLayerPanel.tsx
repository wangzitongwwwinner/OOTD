import { Button, Text, View } from '@tarojs/components';

import type { OutfitNode } from './outfit-model';

export function TryOnLayerPanel({
  nodes,
  selectedNodeId,
  getClothingName,
  onSelect,
  onMoveUp,
  onMoveDown,
  onRemove,
  onReset,
}: {
  nodes: OutfitNode[];
  selectedNodeId?: string;
  getClothingName(clothingId: string): string;
  onSelect(nodeId: string): void;
  onMoveUp(nodeId: string): void;
  onMoveDown(nodeId: string): void;
  onRemove(nodeId: string): void;
  onReset(): void;
}) {
  const ordered = [...nodes].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <View className="tryon-layers">
      <Text className="tryon-layers__title">已选衣物</Text>
      <View className="tryon-layers__list">
        {ordered.length === 0 ? (
          <Text className="tryon-layers__empty">请从底部选择衣物</Text>
        ) : (
          ordered.map((node) => {
            const name = getClothingName(node.clothingId) || '未知衣物';
            return (
              <View
                key={node.id}
                data-testid={`layer-${node.id}`}
                className={`tryon-layers__item ${selectedNodeId === node.id ? 'is-selected' : ''}`}
                onClick={() => onSelect(node.id)}
              >
                <Text className="tryon-layers__name">{name}</Text>
                <View className="tryon-layers__actions">
                  <View className="tryon-layers__order-actions">
                    <Button
                      aria-label={`上移 ${name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onMoveUp(node.id);
                      }}
                    >
                      ↑
                    </Button>
                    <Button
                      aria-label={`下移 ${name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onMoveDown(node.id);
                      }}
                    >
                      ↓
                    </Button>
                  </View>
                  <Button
                    className="tryon-layers__remove"
                    aria-label={`移除 ${name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemove(node.id);
                    }}
                  >
                    ×
                  </Button>
                </View>
              </View>
            );
          })
        )}
      </View>
      <Button className="tryon-layers__reset" onClick={onReset}>
        重置画布
      </Button>
    </View>
  );
}
