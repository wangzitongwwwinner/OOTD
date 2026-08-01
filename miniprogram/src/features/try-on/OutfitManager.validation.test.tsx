import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { OutfitNode } from './outfit-model';
import { OutfitManager } from './OutfitManager';

const node: OutfitNode = {
  id: 'node_1',
  clothingId: 'clothing_1',
  x: 0.4,
  y: 0.2,
  scale: 1,
  zIndex: 1,
};

const service = {
  create: vi.fn(),
  list: vi.fn().mockResolvedValue([]),
};

describe('OutfitManager save modal validation', () => {
  it('hides the example placeholder while the name input is focused', () => {
    render(
      <OutfitManager
        mode="save"
        nodes={[node]}
        onLoad={vi.fn()}
        service={service}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '保存为我的推荐搭配' }));
    const input =
      screen.getByPlaceholderText('如：秋日复古通勤、夏日空调房搭配');

    fireEvent.focus(input);

    expect(
      screen.queryByPlaceholderText('如：秋日复古通勤、夏日空调房搭配'),
    ).not.toBeInTheDocument();
  });

  it('renders the missing-name message inside the save modal', async () => {
    render(
      <OutfitManager
        mode="save"
        nodes={[node]}
        onLoad={vi.fn()}
        service={service}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '保存为我的推荐搭配' }));
    fireEvent.click(screen.getByRole('button', { name: '确认保存搭配' }));

    const message = await screen.findByText('请填写搭配名称');
    expect(message).toHaveClass('outfit-save-modal__message');
    expect(message.closest('.outfit-save-modal')).not.toBeNull();
    expect(service.create).not.toHaveBeenCalled();
  });
});
