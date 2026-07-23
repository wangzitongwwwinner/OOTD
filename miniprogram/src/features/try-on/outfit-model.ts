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
): { x: number; y: number; scale: number } {
  return {
    x: Math.round(node.x * canvasWidth),
    y: Math.round(node.y * canvasHeight),
    scale: node.scale,
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
): OutfitNode {
  return {
    ...node,
    x: Math.max(0, Math.min(1, pixelX / canvasWidth)),
    y: Math.max(0, Math.min(1, pixelY / canvasHeight)),
    scale,
  };
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
