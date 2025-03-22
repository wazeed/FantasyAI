import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Fantasy AI',
  slug: 'fantasy-ai',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#121212'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.fantasyai.app',
    buildNumber: '1.0.0'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#121212'
    },
    package: 'com.fantasyai.app',
    versionCode: 1
  },
  web: {
    favicon: './assets/favicon.png'
  },
  scheme: 'fantasyai',
  extra: {
    eas: {
      projectId: process.env.EAS_PROJECT_ID || 'your-project-id'
    },
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    newArchEnabled: true
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
          newArchEnabled: true
        },
        android: {
          newArchEnabled: true
        }
      }
    ]
  ]
});