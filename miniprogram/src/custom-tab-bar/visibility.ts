type VisibilityListener = (authenticated: boolean) => void;

let authenticated = false;
const listeners = new Set<VisibilityListener>();

export function setTabBarAuthenticated(next: boolean) {
  authenticated = next;
  listeners.forEach((listener) => listener(next));
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
