import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xuxum.app',
  appName: 'Xuxum',
  webDir: 'out',
  
  // Server configuration - points to local dev server
  server: {
    // For development, use your local IP (found via: ipconfig getifaddr en0)
    url: 'http://192.168.100.132:3001',
    cleartext: true,
    // Allow navigation to external URLs (for Firebase, etc)
    allowNavigation: [
      'localhost',
      '192.168.100.132',
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
