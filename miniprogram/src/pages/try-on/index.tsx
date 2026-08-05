import {
  Image,
  MovableArea,
  MovableView,
  Text,
  View,
} from '@tarojs/components';
import { useEffect, useRef, useState } from 'react';
import Taro from '@tarojs/taro';

import { AuthenticatedPage } from '../../features/auth/AuthenticatedPage';
import { useOptionalAuth } from '../../features/auth/AuthGate';
import { GUEST_CLOTHING } from '../../features/wardrobe/guest-clothing';
import {
  listClothing,
  type PublicClothing,
} from '../../features/wardrobe/clothing-service';
import {
  CLOTHING_NODE_SIZE,
  createOutfitNode,
  moveNodeDown,
  moveNodeUp,
  nodeToMovable,
  movableToNode,
  normalizeScale,
  type OutfitNode,
} from '../../features/try-on/outfit-model';
import { OutfitManager } from '../../features/try-on/OutfitManager';
import { TryOnGarmentCatalog } from '../../features/try-on/TryOnGarmentCatalog';
import { TryOnLayerPanel } from '../../features/try-on/TryOnLayerPanel';
import { TryOnTabs, type TryOnTab } from '../../features/try-on/TryOnTabs';
import { useSyncTabBar } from '../../custom-tab-bar/active-tab';

import './index.scss';

export default function TryOnPage() {
  const auth = useOptionalAuth();
  const isGuest = Boolean(auth && auth.status !== 'authenticated');
  useSyncTabBar('tryon');
  const [wardrobe, setWardrobe] = useState<PublicClothing[]>([]);
  const [nodes, setNodes] = useState<OutfitNode[]>([]);
  const [activeTab, setActiveTab] = useState<TryOnTab>('canvas');
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [outfitRefreshKey, setOutfitRefreshKey] = useState(0);
  const pinchRef = useRef<{ dist: number; scale: number }>();
  const [canvasSize, setCanvasSize] = useState({ w: 375, h: 500 });

  async function refreshPersonalWardrobe() {
    const items = await listClothing();
    setWardrobe(items);
    setNodes([]);
    setSelectedNodeId(undefined);
    return items.length > 0;
  }

  useEffect(() => {
    if (isGuest) return;
    void listClothing()
      .then((items) => {
        setWardrobe(items);
        setNodes([]);
        setSelectedNodeId(undefined);
      })
      .catch(() => {});
  }, [isGuest]);

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
    setNodes((current) => {
      const created = createOutfitNode(clothing.id, current.length);
      setSelectedNodeId(created.id);
      return [...current, created];
    });
  }

  function handleRemove(nodeId: string) {
    setNodes((current) => current.filter((n) => n.id !== nodeId));
    setSelectedNodeId((current) => (current === nodeId ? undefined : current));
  }

  const displayedWardrobe = isGuest ? [...GUEST_CLOTHING] : wardrobe;

  function getClothing(id: string) {
    return displayedWardrobe.find((c) => c.id === id);
  }

  return (
    <AuthenticatedPage>
      <View className="tryon-page">
        <TryOnTabs value={activeTab} onChange={setActiveTab} />
        {activeTab === 'canvas' ? (
          <>
            <View className="tryon-page__workspace">
              <TryOnLayerPanel
                nodes={nodes}
                selectedNodeId={selectedNodeId}
                getClothingName={(clothingId) =>
                  getClothing(clothingId)?.name ?? ''
                }
                onSelect={setSelectedNodeId}
                onMoveUp={(nodeId) =>
                  setNodes((current) => moveNodeUp(current, nodeId))
                }
                onMoveDown={(nodeId) =>
                  setNodes((current) => moveNodeDown(current, nodeId))
                }
                onRemove={handleRemove}
                onReset={() => {
                  setNodes([]);
                  setSelectedNodeId(undefined);
                }}
              />
              <View className="tryon-page__canvas-wrapper">
                <MovableArea
                  id="tryon-canvas"
                  className="tryon-page__canvas"
                  scaleArea
                >
                  {nodes.length === 0 ? (
                    <View className="tryon-page__canvas-empty">
                      <Text>试衣搭配画板</Text>
                      <Text>从底栏选取衣物，自由拖拽或调整层叠</Text>
                    </View>
                  ) : null}
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
                          setSelectedNodeId(node.id);
                          const touches = (
                            e as unknown as {
                              touches: Array<{
                                clientX: number;
                                clientY: number;
                              }>;
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
                              touches: Array<{
                                clientX: number;
                                clientY: number;
                              }>;
                            }
                          ).touches;
                          if (touches.length === 2 && pinchRef.current) {
                            const dx = touches[0].clientX - touches[1].clientX;
                            const dy = touches[0].clientY - touches[1].clientY;
                            const newDist = Math.sqrt(dx * dx + dy * dy);
                            const ratio =
                              newDist / (pinchRef.current.dist || 1);
                            const newScale = normalizeScale(
                              pinchRef.current.scale * ratio,
                            );
                            setNodes((current) =>
                              current.map((n) =>
                                n.id === node.id
                                  ? { ...n, scale: newScale }
                                  : n,
                              ),
                            );
                          }
                        }}
                        onTouchEnd={() => {
                          pinchRef.current = undefined;
                        }}
                        onChange={(e) => {
                          if (!e.detail.source) return;
                          setNodes((current) =>
                            current.map((n) =>
                              n.id === node.id
                                ? movableToNode(
                                    n,
                                    e.detail.x,
                                    e.detail.y,
                                    canvasSize.w,
                                    canvasSize.h,
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
                                    scale: normalizeScale(e.detail.scale),
                                  }
                                : n,
                            ),
                          );
                        }}
                      >
                        {clothing ? (
                          <View
                            className={`tryon-page__node-inner ${selectedNodeId === node.id ? 'is-selected' : ''}`}
                            style={{ transform: `scale(${node.scale})` }}
                          >
                            <Image
                              src={
                                clothing.processedFileId ??
                                clothing.sourceFileId
                              }
                              mode="aspectFit"
                              style={{
                                width: CLOTHING_NODE_SIZE,
                                height: CLOTHING_NODE_SIZE,
                              }}
                            />
                          </View>
                        ) : null}
                      </MovableView>
                    );
                  })}
                </MovableArea>
              </View>
            </View>

            <OutfitManager
              mode="save"
              nodes={nodes}
              onLoad={setNodes}
              refreshKey={outfitRefreshKey}
              onGuestAuthenticated={refreshPersonalWardrobe}
              onSaved={() => {
                setOutfitRefreshKey((current) => current + 1);
                setActiveTab('outfits');
              }}
            />

            <TryOnGarmentCatalog items={displayedWardrobe} onAdd={handleAdd} />
          </>
        ) : (
          <OutfitManager
            mode="list"
            nodes={nodes}
            clothing={displayedWardrobe}
            canvasSize={canvasSize}
            onLoad={(loadedNodes) => {
              setNodes(loadedNodes);
              setActiveTab('canvas');
            }}
            refreshKey={outfitRefreshKey}
            onGuestAuthenticated={refreshPersonalWardrobe}
          />
        )}
      </View>
    </AuthenticatedPage>
  );
}
