import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card } from './Card';

describe('Card', () => {
  it('承载有标题关联的编辑式内容', () => {
    render(
      <Card ariaLabel="全天穿衣建议">
        <span>轻薄针织衫配防风外套</span>
      </Card>,
    );

    expect(screen.getByLabelText('全天穿衣建议')).toHaveTextContent(
      '轻薄针织衫配防风外套',
    );
  });
});
