import type { SavedOutfit } from './outfit-service';

export const GUEST_OUTFITS: readonly SavedOutfit[] = [
  {
    id: 'preset_outfit_daily',
    name: '日常休闲搭配',
    seasonTags: ['春秋'],
    colorTags: ['黑白灰'],
    canvasVersion: 1,
    nodes: [
      {
        clothingId: 'preset_clothing_jacket',
        x: 0.34,
        y: 0.08,
        scale: 1,
        rotation: 0,
        zIndex: 1,
      },
      {
        clothingId: 'preset_clothing_pants',
        x: 0.34,
        y: 0.38,
        scale: 1,
        rotation: 0,
        zIndex: 2,
      },
      {
        clothingId: 'preset_clothing_shoes',
        x: 0.34,
        y: 0.7,
        scale: 1,
        rotation: 0,
        zIndex: 3,
      },
    ],
    createdAt: '2026-07-29T05:16:40.771Z',
    updatedAt: '2026-07-29T05:16:40.771Z',
    version: 1,
  },
];
