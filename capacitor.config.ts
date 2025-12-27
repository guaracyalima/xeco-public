import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xuxum.app',
  appName: 'Xuxum',
  webDir: 'out',
  
  // Server configuration - points to Railway staging
  server: {
    url: 'https://xuxum-public-production.up.railway.app',
    cleartext: false,
    // Allow navigation to external URLs (for Firebase, etc)
    allowNavigation: [
      'xuxum-public-production.up.railway.app',
      '*.railway.app',
      'xuxum.com.br',
      '*.xuxum.com.br',
      '*.firebaseapp.com',
      '*.googleapis.com',
    ],
  },
  
  // iOS specific configuration
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },
  
  // Android specific configuration  
  android: {
    allowMixedContent: true,
  },
  
  // Plugins configuration
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#10B981', // Xuxum green
      showSpinner: false,
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#10B981',
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
  },
};

export default config;
