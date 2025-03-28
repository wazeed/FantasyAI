import 'react-native-url-polyfill/auto';
import { createClient, Provider } from '@supabase/supabase-js';
import Constants from 'expo-constants';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.warn('Falling back to hardcoded Supabase credentials');
}

// Use environment variables or hardcoded values for development
const supabaseUrl = process.env.SUPABASE_URL || "https://jphpomjcsnqyiliphmcs.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHBvbWpjc25xeWlsaXBobWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMTQ5NzYsImV4cCI6MjA1ODY5MDk3Nn0.MxS3pbhH9oGSDF-uUH3E4NSPO58W_VIW-kx8Yukslfw";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: false,
    autoRefreshToken: true,
    debug: __DEV__
  }
});

export type AuthProvider = Provider;

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signInWithProvider = async (provider: Provider) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
  });
  if (error) throw error;
  return data;
};

export const AuthProvider = {
  GOOGLE: 'google' as Provider,
  APPLE: 'apple' as Provider,
};
