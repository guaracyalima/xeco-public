import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xuxum.app',
  appName: 'Xuxum',
  webDir: 'out',
  
  // Server configuration - points to deployed app
  server: {
    // In production, point to your deployed URL
    url: 'https://xuxum.com.br',
    // Clear cache on updates
    cleartext: true,
    // Allow navigation to external URLs (for Firebase, etc)
    allowNavigation: [
      'xuxum.com.br',
      '*.xuxum.com.br', 
      '*.firebaseapp.com', 
      '*.googleapis.com',
      '*.railway.app',
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
  },
};

export default config;
