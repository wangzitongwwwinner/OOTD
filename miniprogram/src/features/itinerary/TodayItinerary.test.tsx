import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import type { Scene } from '../scenes/scene-service';
import type { Itinerary } from './itinerary-service';
import { TodayItinerary } from './TodayItinerary';

const itinerary: Itinerary = {
  id: 'itinerary_1',
  startTime: '09:00',
  sceneId: 'scene_office',
  sceneName: '办公室',
  sceneCategory: 'office',
  estimatedTemperatureCelsius: 22,
  durationMinutes: 480,
  createdAt: '2026-07-29T00:00:00.000Z',
  updatedAt: '2026-07-29T00:00:00.000Z',
  version: 1,
};

function scene(name: string, temperature: number): Scene {
  return {
    id: 'scene_office',
    name,
    category: 'office',
    estimatedTemperatureCelsius: temperature,
    feel: 'comfortable',
    isPreset: true,
    createdAt: '2026-07-29T00:00:00.000Z',
    updatedAt: '2026-07-29T00:00:00.000Z',
    version: 2,
  };
}

it('打开添加行程时重新读取场景库的最新修改', async () => {
  const listScenes = vi
    .fn()
    .mockResolvedValueOnce([scene('办公室', 22)])
    .mockResolvedValueOnce([scene('工作室', 24)]);
  const listToday = vi.fn().mockResolvedValue([itinerary]);

  render(
    <TodayItinerary
      sceneDataService={{ list: listScenes }}
      itineraryDataService={{
        listToday,
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      }}
    />,
  );

  expect(await screen.findByText('办公室')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /添加行程/ }));

  await waitFor(() => expect(listScenes).toHaveBeenCalledTimes(2));
  expect(
    await screen.findByText('工作室 (24°C, 体感: 舒适)'),
  ).toBeInTheDocument();
});
