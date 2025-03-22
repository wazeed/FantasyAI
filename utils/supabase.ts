import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'

// Get Supabase credentials from environment variables or app config
const getSupabaseConfig = () => {
  if (Platform.OS === 'web') {
    // For web, use environment variables directly
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    };
  } else {
    // For native, use Expo config
    return {
      url: Constants.expoConfig?.extra?.supabaseUrl,
      key: Constants.expoConfig?.extra?.supabaseAnonKey
    };
  }
};

const { url: supabaseUrl, key: supabaseAnonKey } = getSupabaseConfig();

// Validate that credentials are present
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please check your .env file and app.config.ts');
  throw new Error('Supabase credentials are required.');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web'
  }
});

// Setup redirecting for OAuth in mobile
if (Platform.OS !== 'web') {
  // Register custom redirect scheme for deep linking
  WebBrowser.maybeCompleteAuthSession();
}

// Set up auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session?.user?.email)
})

export type AuthProvider = 'apple' | 'google' | 'email'

export interface AuthResponse {
  success: boolean
  error?: string
  user?: any
  session?: any
}

// Helper for mobile OAuth with Expo's AuthSession
async function performMobileOAuth(provider: string): Promise<AuthResponse> {
  try {
    // Create an auth URL
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'fantasyai', // This should match the "scheme" in app.config.ts
      path: 'auth/callback'
    });

    // Create the sign in URL
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      }
    });

    if (error) throw error;
    if (!data?.url) throw new Error('No auth URL returned');

    // Open the URL with the browser
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUri
    );

    if (result.type === 'success') {
      // Handle success. The URL query params will include tokens
      const { url } = result;
      
      // Handle auth response from URL
      await supabase.auth.setSession({
        access_token: url.split('access_token=')[1].split('&')[0],
        refresh_token: url.split('refresh_token=')[1].split('&')[0] 
      });

      // Get the user after set session
      const { data: { user } } = await supabase.auth.getUser();
      return { success: true, user };
    }

    return { success: false, error: "Browser authentication was cancelled or failed" };
  } catch (error) {
    console.error('Mobile OAuth error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
}

export async function signInWithProvider(provider: AuthProvider): Promise<AuthResponse> {
  try {
    // For mobile devices, use Expo's AuthSession
    if (Platform.OS !== 'web') {
      return await performMobileOAuth(provider);
    }

    // For web, use standard Supabase OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Sign in error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    }
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    return { 
      success: true, 
      user: data.user,
      session: data.session
    }
  } catch (error) {
    console.error('Email sign in error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email authentication failed'
    }
  }
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) throw error

    return { 
      success: true, 
      user: data.user,
      session: data.session
    }
  } catch (error) {
    console.error('Sign up error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sign up failed'
    }
  }
}
