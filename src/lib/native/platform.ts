import { Capacitor } from '@capacitor/core';

/** True only inside the installed Android app (never on the production website). */
export const isNativeApp = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

/** True when the bundle was produced with `vite build --mode admin-app`. */
export const isAdminAppBuild = (): boolean => import.meta.env.MODE === 'admin-app';

