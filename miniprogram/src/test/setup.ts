import '@testing-library/jest-dom/vitest';

import React from 'react';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(cleanup);

vi.mock('@tarojs/taro', () => ({
  default: {
    cloud: { callFunction: vi.fn() },
    getStorageSync: vi.fn(),
    setStorageSync: vi.fn(),
    removeStorageSync: vi.fn(),
  },
}));

vi.mock('@tarojs/components', () => ({
  Button: ({
    loading,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) => {
    return React.createElement('button', {
      ...props,
      'data-loading': String(Boolean(loading)),
    });
  },
  Text: (props: React.HTMLAttributes<HTMLSpanElement>) =>
    React.createElement('span', props),
  Image: (props: React.ImgHTMLAttributes<HTMLImageElement>) =>
    React.createElement('img', props),
  View: (props: React.HTMLAttributes<HTMLDivElement>) =>
    React.createElement('div', props),
}));
