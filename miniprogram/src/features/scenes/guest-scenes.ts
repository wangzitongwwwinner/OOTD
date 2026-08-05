import type { Scene } from './scene-service';

const STABLE_AT = '2026-07-16T00:00:00.000Z';

export const GUEST_SCENES: readonly Scene[] = [
  scene('preset_office', '办公室', 'office', 22, 'cold'),
  scene('preset_home', '家', 'home', 24, 'comfortable'),
  scene('preset_metro', '地铁通勤', 'metro', 26, 'stuffy', '高频活动'),
  scene('preset_mall', '商场', 'mall', 21, 'cool'),
];

function scene(
  id: string,
  name: string,
  category: Scene['category'],
  estimatedTemperatureCelsius: number,
  feel: Scene['feel'],
  note?: string,
): Scene {
  return {
    id,
    name,
    category,
    estimatedTemperatureCelsius,
    feel,
    isPreset: true,
    ...(note ? { note } : {}),
    createdAt: STABLE_AT,
    updatedAt: STABLE_AT,
    version: 1,
  };
}
