import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xuxum.app',
  appName: 'Xuxum',
  webDir: 'out',
  
  // Server configuration - PRODUCTION
  server: {
    url: 'https://xuxum.com.br',
    // Allow navigation to external URLs (for Firebase, etc)
    allowNavigation: [
      'xuxum.com.br',
      '*.xuxum.com.br',
      '*.railway.app',
      '*.firebaseapp.com',
      '*.googleapis.com',
      '*.asaas.com',
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
