import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TryOnTabs } from './TryOnTabs';

describe('TryOnTabs', () => {
  it('按原型展示试衣间和我的搭配，并切换当前视图', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TryOnTabs value="canvas" onChange={onChange} />,
    );

    expect(screen.getByRole('button', { name: '试衣间' })).toHaveClass(
      'is-active',
    );
    fireEvent.click(screen.getByRole('button', { name: '我的搭配' }));
    expect(onChange).toHaveBeenCalledWith('outfits');

    rerender(<TryOnTabs value="outfits" onChange={onChange} />);
    expect(screen.getByRole('button', { name: '我的搭配' })).toHaveClass(
      'is-active',
    );
  });
});
