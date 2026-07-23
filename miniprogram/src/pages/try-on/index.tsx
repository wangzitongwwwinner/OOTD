import {
  Button,
  Image,
  MovableArea,
  MovableView,
  ScrollView,
  Text,
  View,
} from '@tarojs/components';
import { useEffect, useRef, useState } from 'react';
import Taro from '@tarojs/taro';

import { AuthenticatedPage } from '../../features/auth/AuthenticatedPage';
import {
  listClothing,
  type PublicClothing,
} from '../../features/wardrobe/clothing-service';
import {
  CLOTHING_NODE_SIZE,
  createOutfitNode,
  nodeToMovable,
  movableToNode,
  type OutfitNode,
} from '../../features/try-on/outfit-model';

import './index.scss';

export default function TryOnPage() {
  const [wardrobe, setWardrobe] = useState<PublicClothing[]>([]);
  const [nodes, setNodes] = useState<OutfitNode[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const pinchRef = useRef<{ dist: number; scale: number }>();
  const [canvasSize, setCanvasSize] = useState({ w: 375, h: 500 });
  const areaRef = useRef<string>('');

  useEffect(() => {
    let active = true;
    void listClothing()
      .then((items) => active && setWardrobe(items))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const query = Taro.createSelectorQuery();
    query
      .select('#tryon-canvas')
      .boundingClientRect((rect) => {
        const r = Array.isArray(rect) ? rect[0] : rect;
        if (r && typeof r.width === 'number' && typeof r.height === 'number') {
          setCanvasSize({ w: r.width, h: r.height });
        }
      })
      .exec();
  }, []);

  function handleAdd(clothing: PublicClothing) {
    setNodes((current) => [
      ...current,
      createOutfitNode(clothing.id, current.length),
    ]);
    setShowPicker(false);
  }

  function handleRemove(nodeId: string) {
    setNodes((current) => current.filter((n) => n.id !== nodeId));
  }

  function handleBringToFront(nodeId: string) {
    setNodes((current) => {
      const maxZ = current.reduce((m, n) => Math.max(m, n.zIndex), 0);
      return current.map((n) =>
        n.id === nodeId ? { ...n, zIndex: maxZ + 1 } : n,
      );
    });
  }

  function getClothing(id: string) {
    return wardrobe.find((c) => c.id === id);
  }

  const selectedIds = new Set(nodes.map((n) => n.clothingId));

  return (
    <AuthenticatedPage>
      <View className="tryon-page">
        <View className="tryon-page__header">
          <Text className="tryon-page__title">自由试穿</Text>
          <Button
            className="tryon-page__add-btn"
            onClick={() => setShowPicker(true)}
          >
            添加衣物
          </Button>
        </View>
        <View className="tryon-page__canvas-wrapper">
          <MovableArea
            id="tryon-canvas"
            className="tryon-page__canvas"
            scaleArea
          >
            {nodes.map((node) => {
              const clothing = getClothing(node.clothingId);
              const mov = nodeToMovable(node, canvasSize.w, canvasSize.h);
              return (
                <MovableView
                  key={node.id}
                  className="tryon-page__node"
                  direction="all"
                  x={mov.x}
                  y={mov.y}
                  style={{ zIndex: node.zIndex }}
                  onTouchStart={(e) => {
                    const touches = (
                      e as unknown as {
                        touches: Array<{ clientX: number; clientY: number }>;
                      }
                    ).touches;
                    if (touches.length === 2) {
                      const dx = touches[0].clientX - touches[1].clientX;
                      const dy = touches[0].clientY - touches[1].clientY;
                      pinchRef.current = {
                        dist: Math.sqrt(dx * dx + dy * dy),
                        scale: node.scale,
                      };
                    }
                  }}
                  onTouchMove={(e) => {
                    const touches = (
                      e as unknown as {
                        touches: Array<{ clientX: number; clientY: number }>;
                      }
                    ).touches;
                    if (touches.length === 2 && pinchRef.current) {
                      const dx = touches[0].clientX - touches[1].clientX;
                      const dy = touches[0].clientY - touches[1].clientY;
                      const newDist = Math.sqrt(dx * dx + dy * dy);
                      const ratio = newDist / (pinchRef.current.dist || 1);
                      const newScale = Math.max(
                        0.3,
                        Math.min(3, pinchRef.current.scale * ratio),
                      );
                      setNodes((current) =>
                        current.map((n) =>
                          n.id === node.id ? { ...n, scale: newScale } : n,
                        ),
                      );
                    }
                  }}
                  onTouchEnd={() => {
                    pinchRef.current = undefined;
                  }}
                  onChange={(e) => {
                    if (!e.detail.source) return;
                    const nx = e.detail.x - CLOTHING_NODE_SIZE / 2;
                    const ny = e.detail.y - CLOTHING_NODE_SIZE / 2;
                    setNodes((current) =>
                      current.map((n) =>
                        n.id === node.id
                          ? movableToNode(
                              n,
                              Math.max(0, nx),
                              Math.max(0, ny),
                              canvasSize.w - CLOTHING_NODE_SIZE,
                              canvasSize.h - CLOTHING_NODE_SIZE,
                              n.scale,
                            )
                          : n,
                      ),
                    );
                  }}
                  onScale={(e) => {
                    setNodes((current) =>
                      current.map((n) =>
                        n.id === node.id
                          ? {
                              ...n,
                              scale: Math.max(0.3, Math.min(3, e.detail.scale)),
                            }
                          : n,
                      ),
                    );
                  }}
                >
                  {clothing ? (
                    <View
                      className="tryon-page__node-inner"
                      style={{ transform: `scale(${node.scale})` }}
                    >
                      <Image
                        src={clothing.processedFileId ?? clothing.sourceFileId}
                        mode="aspectFit"
                        style={{
                          width: CLOTHING_NODE_SIZE,
                          height: CLOTHING_NODE_SIZE,
                        }}
                      />
                      <View className="tryon-page__node-tools">
                        <Button
                          size="mini"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBringToFront(node.id);
                          }}
                        >
                          前置
                        </Button>
                        <Button
                          size="mini"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(node.id);
                          }}
                        >
                          移除
                        </Button>
                      </View>
                    </View>
                  ) : null}
                </MovableView>
              );
            })}
          </MovableArea>
        </View>

        {showPicker ? (
          <View
            className="tryon-page__picker-mask"
            onClick={() => setShowPicker(false)}
          >
            <View
              className="tryon-page__picker"
              onClick={(e) => e.stopPropagation()}
            >
              <Text className="tryon-page__picker-title">选择衣物</Text>
              <ScrollView scrollY className="tryon-page__picker-scroll">
                {wardrobe.length === 0 ? (
                  <Text className="tryon-page__picker-empty">
                    衣橱为空，请先添加衣物
                  </Text>
                ) : (
                  wardrobe.map((item) => (
                    <View
                      key={item.id}
                      className={`tryon-page__picker-item ${selectedIds.has(item.id) ? 'is-used' : ''}`}
                      onClick={() => handleAdd(item)}
                    >
                      <Image
                        src={item.processedFileId ?? item.sourceFileId}
                        mode="aspectFit"
                      />
                      <Text>{item.name}</Text>
                      {selectedIds.has(item.id) ? (
                        <Text className="tryon-page__picker-used">已添加</Text>
                      ) : null}
                    </View>
                  ))
                )}
              </ScrollView>
              <Button
                className="tryon-page__picker-close"
                onClick={() => setShowPicker(false)}
              >
                关闭
              </Button>
            </View>
          </View>
        ) : null}
      </View>
    </AuthenticatedPage>
  );
}
