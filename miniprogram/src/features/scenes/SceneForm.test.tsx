import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { SceneForm } from './SceneForm';

it('使用 -10–40°C 滑杆编辑预估环境温度', () => {
  const onSave = vi.fn();
  render(
    <SceneForm
      mode="create"
      onSave={onSave}
      onClose={vi.fn()}
      saving={false}
    />,
  );

  const slider = screen.getByRole('slider', { name: '预估环境温度' });
  expect(
    screen
      .getByRole('button', { name: '关闭' })
      .querySelector('img[src="/assets/icons/close.svg"]'),
  ).not.toBeNull();
  expect(slider).toHaveAttribute('min', '-10');
  expect(slider).toHaveAttribute('max', '40');
  expect(screen.getByText('-10°C（严寒环境）')).toBeInTheDocument();
  expect(screen.getByText('40°C（酷暑无冷气）')).toBeInTheDocument();

  fireEvent.change(slider, { target: { value: '26' } });
  expect(screen.getByText('26°C')).toBeInTheDocument();

  fireEvent.input(screen.getByPlaceholderText('例如：书店、健身房、大平层'), {
    target: { value: '书店' },
  });
  fireEvent.click(screen.getByRole('button', { name: '确认新建' }));
  expect(onSave).toHaveBeenCalledWith(
    expect.objectContaining({ estimatedTemperatureCelsius: 26 }),
  );
});
