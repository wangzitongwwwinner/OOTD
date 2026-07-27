import { describe, expect, it, vi } from 'vitest';

import {
  getTabBarAuthenticated,
  setTabBarAuthenticated,
  subscribeTabBarAuthenticated,
} from './visibility';

describe('自定义导航登录态', () => {
  it('向自定义导航同步登录与退出状态', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeTabBarAuthenticated(listener);

    setTabBarAuthenticated(true);
    expect(getTabBarAuthenticated()).toBe(true);
    expect(listener).toHaveBeenLastCalledWith(true);

    unsubscribe();
    setTabBarAuthenticated(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
