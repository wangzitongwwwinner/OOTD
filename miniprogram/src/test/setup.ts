import '@testing-library/jest-dom/vitest';

import React from 'react';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(cleanup);

vi.mock('@tarojs/taro', () => ({
  useDidShow: vi.fn((callback: () => void) => callback()),
  default: {
    cloud: { callFunction: vi.fn(), uploadFile: vi.fn() },
    getSetting: vi.fn().mockResolvedValue({ authSetting: {} }),
    getLocation: vi.fn(),
    authorize: vi.fn(),
    openSetting: vi.fn().mockResolvedValue({ authSetting: {} }),
    showActionSheet: vi.fn(),
    previewImage: vi.fn(),
    chooseMedia: vi.fn(),
    showToast: vi.fn(),
    navigateBack: vi.fn(),
    getMenuButtonBoundingClientRect: vi.fn().mockReturnValue({
      top: 24,
      height: 32,
    }),
    getWindowInfo: vi.fn().mockReturnValue({ statusBarHeight: 20 }),
    getStorageSync: vi.fn(),
    setStorageSync: vi.fn(),
    removeStorageSync: vi.fn(),
    showModal: vi.fn(),
    reLaunch: vi.fn(),
    navigateTo: vi.fn(),
    switchTab: vi.fn(),
    hideTabBar: vi.fn(),
  },
}));

vi.mock('@tarojs/components', () => ({
  Button: ({
    loading,
    openType,
    onOpenSetting,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
    openType?: string;
    onOpenSetting?: (event: unknown) => void;
  }) => {
    return React.createElement('button', {
      ...props,
      'data-loading': String(Boolean(loading)),
      'data-open-type': openType,
      'data-has-open-setting-handler': String(Boolean(onOpenSetting)),
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
  Slider: ({
    onChange,
    ...props
  }: React.InputHTMLAttributes<HTMLInputElement> & {
    onChange?: (event: { detail: { value: number } }) => void;
  }) =>
    React.createElement('input', {
      ...props,
      type: 'range',
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        onChange?.({ detail: { value: Number(event.currentTarget.value) } }),
    }),
  View: (props: React.HTMLAttributes<HTMLDivElement>) =>
    React.createElement('div', props),
  ScrollView: (
    props: React.HTMLAttributes<HTMLDivElement> & { scrollY?: boolean },
  ) => {
    const { scrollY, ...elementProps } = props;
    void scrollY;
    return React.createElement('div', elementProps);
  },
  Picker: (props: Record<string, unknown>) =>
    React.createElement('div', {
      ...props,
      'data-mode': props.mode,
      'data-value': props.value,
    }),
}));
