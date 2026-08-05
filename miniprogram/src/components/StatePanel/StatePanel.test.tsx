import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EmptyState } from '../EmptyState/EmptyState';
import { ErrorState } from '../ErrorState/ErrorState';

describe('状态面板', () => {
  it('空态可以提供下一步操作', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="还没有行程"
        actionLabel="添加行程"
        onAction={onAction}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '添加行程' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('错误态说明问题并允许重试', () => {
    const onRetry = vi.fn();
    render(
      <ErrorState
        title="加载失败"
        description="请检查网络后重试"
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('请检查网络后重试');
    fireEvent.click(screen.getByRole('button', { name: '重新加载' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
