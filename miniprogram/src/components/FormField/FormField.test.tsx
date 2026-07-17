import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FormField } from './FormField';

describe('FormField', () => {
  it('将标签、说明和错误关联到输入控件', () => {
    render(
      <FormField label="场景名称" hint="最多 20 个字" error="请输入场景名称">
        <input />
      </FormField>,
    );

    const input = screen.getByRole('textbox', { name: '场景名称' });
    const describedBy = input.getAttribute('aria-describedby');

    expect(describedBy).toContain('hint');
    expect(describedBy).toContain('error');
    expect(screen.getByRole('alert')).toHaveTextContent('请输入场景名称');
  });
});
