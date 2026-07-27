import { useEffect, useState } from 'react';

import { AppTabBar, type AppTab } from '../components/AppTabBar/AppTabBar';
import {
  getTabBarAuthenticated,
  subscribeTabBarAuthenticated,
} from './visibility';
import {
  getTabBarActive,
  setTabBarActive,
  subscribeTabBarActive,
} from './active-tab';

export default function CustomTabBar() {
  const [visible, setVisible] = useState(getTabBarAuthenticated);
  const [active, setActive] = useState<AppTab>(getTabBarActive);

  useEffect(() => subscribeTabBarAuthenticated(setVisible), []);
  useEffect(() => subscribeTabBarActive(setActive), []);

  return (
    <AppTabBar active={active} visible={visible} onSelect={setTabBarActive} />
  );
}

CustomTabBar.options = {
  addGlobalClass: true,
};
