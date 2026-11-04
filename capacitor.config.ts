import type { CapacitorConfig } from '@capacitor/cli';

// Private, single-device admin app (Spec 38). Not published anywhere.
const config: CapacitorConfig = {
  appId: 'com.tqmaster.adminalert',
  appName: 'TQMaster Admin',
  webDir: 'dist-app',
  android: {
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#f4f7fc',
      androidScaleType: 'CENTER_INSIDE',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;

