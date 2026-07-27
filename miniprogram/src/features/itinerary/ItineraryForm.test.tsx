import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { ItineraryForm } from './ItineraryForm';

const scenes = [
  {
    id: 'home',
    name: '家',
    category: 'home',
    estimatedTemperatureCelsius: 24,
    feel: 'comfortable' as const,
  },
];

it('按原型展示规划行程弹层字段与操作', () => {
  render(
    <ItineraryForm
      mode="create"
      scenes={scenes}
      onSave={vi.fn()}
      onClose={vi.fn()}
      saving={false}
    />,
  );

  expect(screen.getByText('规划新行程')).toBeInTheDocument();
  expect(screen.getByText('出发时间')).toBeInTheDocument();
  expect(screen.getByText('到达场景')).toBeInTheDocument();
  expect(screen.getByText('家 (24°C, 体感: 舒适)')).toBeInTheDocument();
  expect(screen.getByText('预计逗留时长（小时）')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: '添加至今日行程' }),
  ).toBeInTheDocument();
});

it('小时制输入保存时转换为分钟', () => {
  const onSave = vi.fn();
  render(
    <ItineraryForm
      mode="create"
      scenes={scenes}
      onSave={onSave}
      onClose={vi.fn()}
      saving={false}
    />,
  );

  fireEvent.input(screen.getByDisplayValue('1'), {
    target: { value: '2' },
  });
  fireEvent.click(screen.getByRole('button', { name: '添加至今日行程' }));
  expect(onSave).toHaveBeenCalledWith(
    expect.objectContaining({ durationMinutes: 120 }),
  );
});
