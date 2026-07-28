import { describe, expect, it } from 'vitest';

import {
  bringNodeToFront,
  movableToNode,
  moveNodeDown,
  moveNodeUp,
  nodeToMovable,
  normalizeScale,
  type OutfitNode,
} from './outfit-model';

const node: OutfitNode = {
  id: 'node-1',
  clothingId: 'clothing-1',
  x: 0.5,
  y: 0.25,
  scale: 1,
  zIndex: 2,
};

describe('outfit model', () => {
  it('uses the movable range when restoring normalized coordinates', () => {
    expect(nodeToMovable(node, 360, 600, 120)).toEqual({
      x: 120,
      y: 120,
      scale: 1,
    });
  });

  it('round-trips a node across different canvas sizes', () => {
    const first = nodeToMovable(node, 360, 600, 120);
    const saved = movableToNode(node, first.x, first.y, 360, 600, 1, 120);
    const restored = nodeToMovable(saved, 720, 960, 120);

    expect(saved.x).toBeCloseTo(node.x);
    expect(saved.y).toBeCloseTo(node.y);
    expect(restored.x).toBe(300);
    expect(restored.y).toBe(210);
  });

  it('clamps coordinates and scale to supported bounds', () => {
    const saved = movableToNode(node, -40, 900, 360, 600, 9, 120);

    expect(saved.x).toBe(0);
    expect(saved.y).toBe(1);
    expect(saved.scale).toBe(3);
    expect(normalizeScale(0.1)).toBe(0.3);
  });

  it('raises only the selected node above the current top layer', () => {
    const nodes = [
      node,
      { ...node, id: 'node-2', zIndex: 7 },
      { ...node, id: 'node-3', zIndex: 4 },
    ];

    expect(bringNodeToFront(nodes, 'node-1')).toEqual([
      { ...node, zIndex: 8 },
      nodes[1],
      nodes[2],
    ]);
  });

  it('moves the selected node up exactly one adjacent layer', () => {
    const nodes = [
      node,
      { ...node, id: 'node-2', zIndex: 7 },
      { ...node, id: 'node-3', zIndex: 4 },
    ];

    expect(moveNodeUp(nodes, 'node-1')).toEqual([
      { ...node, zIndex: 4 },
      nodes[1],
      { ...nodes[2], zIndex: 2 },
    ]);
  });

  it('moves the selected node down exactly one adjacent layer', () => {
    const nodes = [
      node,
      { ...node, id: 'node-2', zIndex: 7 },
      { ...node, id: 'node-3', zIndex: 4 },
    ];

    expect(moveNodeDown(nodes, 'node-2')).toEqual([
      nodes[0],
      { ...nodes[1], zIndex: 4 },
      { ...nodes[2], zIndex: 7 },
    ]);
  });

  it('keeps nodes unchanged at the top and bottom boundaries', () => {
    const nodes = [
      node,
      { ...node, id: 'node-2', zIndex: 7 },
      { ...node, id: 'node-3', zIndex: 4 },
    ];

    expect(moveNodeUp(nodes, 'node-2')).toEqual(nodes);
    expect(moveNodeDown(nodes, 'node-1')).toEqual(nodes);
  });
});
