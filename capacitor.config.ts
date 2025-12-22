import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.quasar.aetherrescue',
  appName: 'Aether Rescue',
  webDir: 'dist',
  android: {
    backgroundColor: '#020617',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#020617',
      showSpinner: false
    }
  }
};

export default config;

