import { describe, expect, it, vi } from 'vitest';

import {
  getTabBarActive,
  setTabBarActive,
  subscribeTabBarActive,
} from './active-tab';

describe('自定义导航选中态', () => {
  it('以页面 onShow 同步的标识作为唯一选中项', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeTabBarActive(listener);

    setTabBarActive('wardrobe');

    expect(getTabBarActive()).toBe('wardrobe');
    expect(listener).toHaveBeenCalledWith('wardrobe');
    unsubscribe();
  });
});
