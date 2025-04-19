import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '../types/database'; // Use relative path for database types
import Constants from 'expo-constants';

// Get Supabase credentials from Expo Constants (loaded via app.config.ts)
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseKey;

// Validate configuration
if (!supabaseUrl) {
  console.error("Missing Supabase URL in app configuration. Check your .env file and app.config.ts.");
  // Provide fallback for development only
  if (__DEV__) {
    console.warn("Using fallback development configuration. This should NOT be used in production.");
  } else {
    throw new Error("Missing Supabase URL configuration");
  }
}
if (!supabaseAnonKey) {
  console.error("Missing Supabase anon key in app configuration. Check your .env file and app.config.ts.");
  // Provide fallback for development only
  if (__DEV__) {
    console.warn("Using fallback development configuration. This should NOT be used in production.");
  } else {
    throw new Error("Missing Supabase anon key configuration");
  }
}

// --- DEBUGGING LOGS ---
console.log("Supabase URL being used:", supabaseUrl);
console.log("Supabase Anon Key being used:", supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'undefined'); // Log only a portion for security
// --- END DEBUGGING LOGS ---

// Initialize the Supabase client for React Native
export const supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    storage: AsyncStorage, // Use AsyncStorage for session persistence in React Native
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for React Native
    // debug: __DEV__, // Optional: enable debug logs in development
  },
});

// Note: Auth-related functions (signIn, signUp, etc.) have been removed
// as they should reside in a dedicated authentication service (e.g., services/authService.ts).
