import { useDidShow } from '@tarojs/taro';

import type { AppTab } from '../components/AppTabBar/AppTabBar';

type ActiveTabListener = (active: AppTab) => void;

let activeTab: AppTab = 'home';
const listeners = new Set<ActiveTabListener>();

export function setTabBarActive(next: AppTab) {
  activeTab = next;
  listeners.forEach((listener) => listener(next));
}

export function getTabBarActive() {
  return activeTab;
}

export function subscribeTabBarActive(listener: ActiveTabListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSyncTabBar(active: AppTab) {
  useDidShow(() => setTabBarActive(active));
}
