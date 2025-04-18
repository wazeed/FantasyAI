import 'dotenv/config';

export default {
  name: "Fantasy AI",
  version: "1.0.0",
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
  plugins: [
    [
      "expo-build-properties",
      {
        ios: {
          deploymentTarget: "15.1"
        },
        android: {
          compileSdkVersion: 33,
          targetSdkVersion: 33,
          buildToolsVersion: "33.0.0"
        }
      }
    ]
  ],
  android: {
    package: "com.fantasyai.app",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#FFFFFF"
    }
  },
  ios: {
    bundleIdentifier: "com.fantasyai.app",
    buildNumber: "1.0.0",
    supportsTablet: true
  }
};