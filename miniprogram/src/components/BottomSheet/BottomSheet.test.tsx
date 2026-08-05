import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BottomSheet } from './BottomSheet';

describe('BottomSheet', () => {
  it('关闭时不渲染内容', () => {
    render(
      <BottomSheet open={false} title="新增场景" onClose={vi.fn()}>
        表单内容
      </BottomSheet>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('打开时展示标题和内容，且仅点击遮罩关闭', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open title="新增场景" onClose={onClose}>
        <span>表单内容</span>
      </BottomSheet>,
    );

    const dialog = screen.getByRole('dialog', { name: '新增场景' });
    expect(dialog).toHaveTextContent('表单内容');
    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('bottom-sheet-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
