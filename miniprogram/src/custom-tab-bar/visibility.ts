type VisibilityListener = (authenticated: boolean) => void;

let authenticated = true;
const listeners = new Set<VisibilityListener>();

export function setTabBarAuthenticated(next: boolean) {
  void next;
  authenticated = true;
  listeners.forEach((listener) => listener(true));
}

export function getTabBarAuthenticated() {
  return authenticated;
}

export function subscribeTabBarAuthenticated(listener: VisibilityListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
