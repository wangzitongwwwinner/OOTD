import '@testing-library/jest-dom/vitest';

import React from 'react';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(cleanup);

vi.mock('@tarojs/taro', () => ({
  default: {
    cloud: { callFunction: vi.fn(), uploadFile: vi.fn() },
    getSetting: vi.fn(),
    authorize: vi.fn(),
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
  Input: ({
    onInput,
    ...props
  }: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onInput'> & {
    onInput?: (event: { detail: { value: string } }) => void;
  }) =>
    React.createElement('input', {
      ...props,
      onInput: (event: React.FormEvent<HTMLInputElement>) =>
        onInput?.({ detail: { value: event.currentTarget.value } }),
    }),
  View: (props: React.HTMLAttributes<HTMLDivElement>) =>
    React.createElement('div', props),
  Picker: (props: Record<string, unknown>) =>
    React.createElement('div', {
      ...props,
      'data-mode': props.mode,
      'data-value': props.value,
    }),
}));
