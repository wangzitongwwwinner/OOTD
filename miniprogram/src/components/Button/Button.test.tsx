import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button';

describe('Button', () => {
  it('点击主要按钮时触发操作', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>生成建议</Button>);

    fireEvent.click(screen.getByRole('button', { name: '生成建议' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('加载时展示进度且阻止重复操作', () => {
    const onClick = vi.fn();
    render(
      <Button loading loadingText="生成中…" onClick={onClick}>
        生成建议
      </Button>,
    );

    const button = screen.getByRole('button', { name: '生成中…' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('支持次要按钮样式', () => {
    render(<Button variant="secondary">取消</Button>);

    expect(screen.getByRole('button', { name: '取消' })).toHaveClass(
      'ui-button--secondary',
    );
  });
});
