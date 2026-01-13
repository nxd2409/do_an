import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'smr.d2s.com.vn',
  appName: 'Smart Meeting Room',
  webDir: 'dist/PROJECT.CLI/browser',
  android: {
    useLegacyBridge: false,
    adjustMarginsForEdgeToEdge: 'force'
  },
  plugins: {
    StatusBar: {
      enabled: true,
      overlaysWebView: false,
      style: 'LIGHT',
      backgroundColor: '#ffffff'
    }
  }
};

export default config;
