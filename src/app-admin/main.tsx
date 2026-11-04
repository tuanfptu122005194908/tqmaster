import { createRoot } from 'react-dom/client';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { isNativeApp } from '@/lib/native/platform';
import AdminApp from './AdminApp';

async function prepareNative() {
  if (!isNativeApp()) return;
  try {
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch {
    // optional on some devices
  }
}

void prepareNative();
createRoot(document.getElementById('root')!).render(<AdminApp />);
if (isNativeApp()) void SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => undefined);

