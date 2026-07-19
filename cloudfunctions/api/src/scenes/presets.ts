import {
  sceneSchema,
  type Scene,
} from '../../../../packages/contracts/src/index.ts';

const STABLE_AT = '2026-07-16T00:00:00.000Z';

export const PRESET_SCENES: readonly Scene[] = [
  preset('preset_office', '办公室', 'office', 22, 'cold'),
  preset('preset_home', '家', 'home', 24, 'comfortable'),
  preset('preset_metro', '地铁通勤', 'metro', 26, 'stuffy', '高频活动'),
  preset('preset_mall', '商场', 'mall', 21, 'cool'),
];

function preset(
  id: string,
  name: string,
  category: Scene['category'],
  estimatedTemperatureCelsius: number,
  feel: Scene['feel'],
  note?: string,
): Scene {
  return sceneSchema.parse({
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
  });
}
