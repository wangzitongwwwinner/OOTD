import type { Itinerary } from './itinerary-service';

const STABLE_AT = '2026-07-16T00:00:00.000Z';

export const GUEST_ITINERARIES: readonly Itinerary[] = [
  itinerary(
    'preset_itinerary_metro',
    '08:00',
    'preset_metro',
    '地铁通勤',
    'metro',
    26,
    60,
  ),
  itinerary(
    'preset_itinerary_office',
    '09:00',
    'preset_office',
    '办公室',
    'office',
    22,
    480,
  ),
];

function itinerary(
  id: string,
  startTime: string,
  sceneId: string,
  sceneName: string,
  sceneCategory: Itinerary['sceneCategory'],
  estimatedTemperatureCelsius: number,
  durationMinutes: number,
): Itinerary {
  return {
    id,
    startTime,
    sceneId,
    sceneName,
    sceneCategory,
    estimatedTemperatureCelsius,
    durationMinutes,
    createdAt: STABLE_AT,
    updatedAt: STABLE_AT,
    version: 1,
  };
}
