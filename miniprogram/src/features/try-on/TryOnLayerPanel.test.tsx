import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TryOnLayerPanel } from './TryOnLayerPanel';

const nodes = [
  {
    id: 'node_1',
    clothingId: 'clothing_1',
    x: 0.5,
    y: 0.4,
    scale: 1,
    zIndex: 1,
  },
  {
    id: 'node_2',
    clothingId: 'clothing_2',
    x: 0.5,
    y: 0.4,
    scale: 1,
    zIndex: 2,
  },
];

describe('TryOnLayerPanel', () => {
  it('按层级展示已选衣物并提供上移、下移、删除和重置', () => {
    const onSelect = vi.fn();
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();
    const onRemove = vi.fn();
    const onReset = vi.fn();
    render(
      <TryOnLayerPanel
        nodes={nodes}
        selectedNodeId="node_2"
        getClothingName={(id) =>
          id === 'clothing_1' ? '白色衬衫' : '黑色长裤'
        }
        onSelect={onSelect}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onRemove={onRemove}
        onReset={onReset}
      />,
    );

    expect(screen.getByText('已选衣物')).toBeInTheDocument();
    expect(screen.getByText('黑色长裤')).toAppearBefore(
      screen.getByText('白色衬衫'),
    );
    expect(screen.getByTestId('layer-node_2')).toHaveClass('is-selected');

    fireEvent.click(screen.getByText('白色衬衫'));
    fireEvent.click(screen.getByLabelText('上移 白色衬衫'));
    fireEvent.click(screen.getByLabelText('下移 白色衬衫'));
    fireEvent.click(screen.getByLabelText('移除 白色衬衫'));
    fireEvent.click(screen.getByRole('button', { name: '重置画布' }));
    expect(onSelect).toHaveBeenCalledWith('node_1');
    expect(onMoveUp).toHaveBeenCalledWith('node_1');
    expect(onMoveDown).toHaveBeenCalledWith('node_1');
    expect(onRemove).toHaveBeenCalledWith('node_1');
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('没有衣物时展示原型空状态', () => {
    render(
      <TryOnLayerPanel
        nodes={[]}
        getClothingName={() => ''}
        onSelect={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onRemove={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByText('请从底部选择衣物')).toBeInTheDocument();
  });
});
