import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { WardrobeHeader } from './WardrobeHeader';

it('按原型展示衣物数量并从顶部按钮打开录入流程', () => {
  const onAdd = vi.fn();
  render(<WardrobeHeader count={6} onAdd={onAdd} />);

  expect(screen.getByText('我的衣橱')).toBeInTheDocument();
  expect(screen.getByText('6 件衣物 · 最近更新 今天')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '录入衣物' }));
  expect(onAdd).toHaveBeenCalledTimes(1);
});
