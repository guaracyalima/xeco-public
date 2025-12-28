import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xuxum.app',
  appName: 'Xuxum Dev',
  webDir: 'out',
  
  // Server configuration - LOCAL DEV SERVER
  server: {
    url: 'http://192.168.100.132:3001',
    cleartext: true,
    // Allow navigation to external URLs (for Firebase, etc)
    allowNavigation: [
      '192.168.100.132:3001',
      'localhost:3001',
      '*.railway.app',
      'xuxum.com.br',
      '*.xuxum.com.br',
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
