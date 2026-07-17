import '@testing-library/jest-dom/vitest';

import React from 'react';
import { vi } from 'vitest';

vi.mock('@tarojs/components', () => ({
  Button: ({
    loading,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) => {
    void loading;
    return React.createElement('button', props);
  },
  Text: (props: React.HTMLAttributes<HTMLSpanElement>) =>
    React.createElement('span', props),
  View: (props: React.HTMLAttributes<HTMLDivElement>) =>
    React.createElement('div', props),
}));
