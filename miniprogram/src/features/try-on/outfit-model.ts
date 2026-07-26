import type { PublicClothing } from '../wardrobe/clothing-service';

export interface OutfitNode {
  id: string;
  clothingId: string;
  /** 0-1 normalized x relative to canvas width */
  x: number;
  /** 0-1 normalized y relative to canvas height */
  y: number;
  /** 0.2-3 scale factor */
  scale: number;
  /** stacking order (higher = front) */
  zIndex: number;
}

export interface OutfitDraft {
  nodes: OutfitNode[];
  clothing: PublicClothing[];
}

/** Convert normalized coordinates to movable-view pixel values */
export function nodeToMovable(
  node: OutfitNode,
  canvasWidth: number,
  canvasHeight: number,
  nodeSize = CLOTHING_NODE_SIZE,
): { x: number; y: number; scale: number } {
  const movableWidth = Math.max(1, canvasWidth - nodeSize);
  const movableHeight = Math.max(1, canvasHeight - nodeSize);
  return {
    x: Math.round(node.x * movableWidth),
    y: Math.round(node.y * movableHeight),
    scale: normalizeScale(node.scale),
  };
}

/** Convert movable-view pixel values back to normalized coordinates */
export function movableToNode(
  node: OutfitNode,
  pixelX: number,
  pixelY: number,
  canvasWidth: number,
  canvasHeight: number,
  scale: number,
  nodeSize = CLOTHING_NODE_SIZE,
): OutfitNode {
  const movableWidth = Math.max(1, canvasWidth - nodeSize);
  const movableHeight = Math.max(1, canvasHeight - nodeSize);
  return {
    ...node,
    x: Math.max(0, Math.min(1, pixelX / movableWidth)),
    y: Math.max(0, Math.min(1, pixelY / movableHeight)),
    scale: normalizeScale(scale),
  };
}

export function normalizeScale(scale: number): number {
  return Math.max(0.3, Math.min(3, scale));
}

export function bringNodeToFront(
  nodes: OutfitNode[],
  nodeId: string,
): OutfitNode[] {
  const maxZ = nodes.reduce(
    (maximum, node) => Math.max(maximum, node.zIndex),
    0,
  );
  return nodes.map((node) =>
    node.id === nodeId ? { ...node, zIndex: maxZ + 1 } : node,
  );
}

export function createOutfitNode(
  clothingId: string,
  zIndex: number,
): OutfitNode {
  return {
    id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    clothingId,
    x: 0.3,
    y: 0.2,
    scale: 1,
    zIndex,
  };
}

export const CLOTHING_NODE_SIZE = 120;
