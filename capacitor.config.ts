import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.onstream.app',
  appName: 'OnStream',
  webDir: 'frontend/build',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#111827',
      showSpinner: false,
      spinnerColor: '#ef4444'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#111827'
    },
    Keyboard: {
      resize: 'body',
      style: 'dark'
    },
    App: {
      backButtonExitApp: false
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true
  }
};

export default config;