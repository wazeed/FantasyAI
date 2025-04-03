import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '../utils/supabase'; // Removed unused specific auth functions
import { Session, User, Provider } from '@supabase/supabase-js';
// Removed duplicate AuthProvider import
import * as WebBrowser from 'expo-web-browser';
// Removed unused Platform import
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
// Removed loggingService import as it's not confirmed to exist/be exported

// Constants for guest message tracking
const GUEST_MESSAGE_COUNT_KEY = 'guest_message_count';
const OFFER_THRESHOLD = 3; // Show offer after this many messages
const OFFER_SHOWN_KEY = 'subscription_offer_shown';
// Removed unused DISCOUNT_OFFER_LAST_SHOWN_KEY

// Use interface as preferred in custom instructions
interface AuthContextInterface {
  user: User | null;
  session: Session | null;
  isLoading: boolean; // Renamed for clarity (isLoading vs loading)
  isGuest: boolean;
  guestMessageCount: number;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: Provider) => Promise<{ success: boolean; error?: string }>;
  signInWithApple: () => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  skipAuth: () => void;
  incrementGuestMessageCount: () => Promise<void>;
  shouldShowSubscriptionOffer: () => Promise<boolean>;
  shouldShowDiscountOffer: () => Promise<boolean>;
  markDiscountOfferShown: () => Promise<void>; // Kept for API compatibility, though logic is now minimal
}

const AuthContext = createContext<AuthContextInterface | undefined>(undefined);

export const AuthContextProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Renamed state setter
  const [isGuest, setIsGuest] = useState(false);
  const [guestMessageCount, setGuestMessageCount] = useState<number>(0);
  const [offerShown, setOfferShown] = useState(false);
  // Removed unused lastDiscountOfferDate state

  // Combined initialization useEffect
  useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted component

    async function initializeAuth() {
      try {
        // 1. Check Supabase session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Error fetching Supabase session:', sessionError);
        }

        if (isMounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          // If there's a session, user is not a guest initially
          if (currentSession) {
            setIsGuest(false);
          }
        }

        // 2. Check local storage for guest status (only if no session)
        if (!currentSession) {
          if (isMounted) setIsGuest(false); // Default to false if no session initially
          try {
            const guestMode = await AsyncStorage.getItem('guest_mode');
            if (guestMode === 'true') {
              // Set to true ONLY if confirmed by storage
              if (isMounted) {
                setIsGuest(true);

                // Load guest message count
                const countStr = await AsyncStorage.getItem(GUEST_MESSAGE_COUNT_KEY);
                if (countStr) { // No need for isMounted check here as it's within the outer isMounted block implicitly
                  setGuestMessageCount(parseInt(countStr, 10));
                }

                // Load if subscription offer has been shown
                const offerShownString = await AsyncStorage.getItem(OFFER_SHOWN_KEY);
                setOfferShown(offerShownString === 'true'); // No need for isMounted check

                // Removed loading of last discount date as it's unused
              }
            }
            // No 'else' needed here, as we defaulted to false above
          } catch (storageError) {
            console.error("Error reading guest_mode from AsyncStorage:", storageError);
            // Ensure isGuest remains false in case of storage error
            if (isMounted) setIsGuest(false);
          }
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
        // Decide on default state in case of error, e.g., logged out
        if (isMounted) {
            setSession(null);
            setUser(null);
            setIsGuest(false); // Default to non-guest on error? Or guest? Needs clarification. Assuming non-guest.
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    // Setup auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (isMounted) {
            setSession(newSession);
            setUser(newSession?.user ?? null);
            // If auth state changes to having a session, ensure guest mode is off
            // If auth state changes to no session, guest status depends on whether user explicitly skips auth later
            if (newSession) {
                setIsGuest(false);
                // Reset guest-specific state if user logs in?
                setGuestMessageCount(0);
                setOfferShown(false);
                AsyncStorage.removeItem(GUEST_MESSAGE_COUNT_KEY);
                AsyncStorage.removeItem(OFFER_SHOWN_KEY);
                AsyncStorage.removeItem('guest_mode');
            }
        }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.warn('Sign in failed:', { email, error: error.message });
        return { success: false, error: error.message };
      }
      // Auth listener will handle setting user/session and isGuest=false
      return { success: true };
    } catch (error: any) {
      console.error('Unexpected sign in error:', { email, error });
      return { success: false, error: error.message || 'An unexpected error occurred during sign in' };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      // Note: Supabase signUp sends a confirmation email by default.
      // The user state might not immediately reflect a logged-in user until confirmation.
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        console.warn('Sign up failed:', { email, error: error.message });
        return { success: false, error: error.message };
      }
      // Auth listener might set user/session briefly, or wait for confirmation depending on Supabase settings.
      // Explicitly setting isGuest to false might be premature if email confirmation is needed.
      // However, aligning with original logic for now.
      setIsGuest(false);
      return { success: true }; // Indicates sign up request initiated
    } catch (error: any) {
      console.error('Unexpected sign up error:', { email, error });
      return { success: false, error: error.message || 'An unexpected error occurred during sign up' };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        // Even if signout fails, attempt to clear local state as a fallback?
        setSession(null);
        setUser(null);
        setIsGuest(false); // Explicitly set to non-guest on sign out
      }
      // Auth listener should handle setting user/session to null.
      // Clear guest mode flag on sign out
      await AsyncStorage.removeItem('guest_mode');
      await AsyncStorage.removeItem(GUEST_MESSAGE_COUNT_KEY);
      await AsyncStorage.removeItem(OFFER_SHOWN_KEY);
    } catch (error) {
      console.error('Unexpected error during sign out cleanup:', error);
      // Ensure local state is cleared even if AsyncStorage fails
      setSession(null);
      setUser(null);
      setIsGuest(false);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithOAuth = async (provider: Provider): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      // TODO: Consider making the redirect URL configurable via environment variables
      const redirectTo = 'fantasyai://auth/callback';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });

      if (error) {
        console.warn('OAuth sign in initiation failed:', { provider, error: error.message });
        return { success: false, error: error.message };
      }

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type !== 'success') {
          // Handle cancellation or failure if needed
          console.info('OAuth flow cancelled or failed', { result });
          // Don't return error here, as the user might just close the browser
        }
      } else {
         console.warn('OAuth sign in did not return a URL', { provider });
         return { success: false, error: 'Could not get OAuth sign-in URL.' };
      }

      // Auth listener will handle setting user/session and isGuest=false if successful
      return { success: true }; // Indicates OAuth flow initiated
    } catch (error: any) {
      console.error('Unexpected OAuth sign in error:', { provider, error });
      return { success: false, error: error.message || 'An unexpected error occurred during OAuth sign in' };
    } finally {
      // Don't set loading false immediately, wait for auth listener or potential error/cancel
      // setIsLoading(false); // Let the auth listener or flow completion handle loading state
    }
  };

  const signInWithApple = (): Promise<{ success: boolean; error?: string }> => {
    // Supabase Provider type might not directly include 'apple', casting needed
    return signInWithOAuth('apple' as Provider);
  };

  const signInWithGoogle = (): Promise<{ success: boolean; error?: string }> => {
    // Supabase Provider type might not directly include 'google', casting needed
    return signInWithOAuth('google' as Provider);
  };

  const skipAuth = async (): Promise<void> => {
    setIsLoading(true);
    try {
        setSession(null);
        setUser(null);
        setIsGuest(true);
        setGuestMessageCount(0); // Reset count when entering guest mode
        setOfferShown(false);
        await AsyncStorage.setItem('guest_mode', 'true');
        await AsyncStorage.setItem(GUEST_MESSAGE_COUNT_KEY, '0');
        await AsyncStorage.removeItem(OFFER_SHOWN_KEY); // Ensure offer shown flag is reset
        // Removed setting unused discount date key
    } catch (error) {
        console.error('Error setting guest mode:', error);
        // Fallback: ensure state reflects guest mode attempt even if storage fails
        setSession(null);
        setUser(null);
        setIsGuest(true);
    } finally {
        setIsLoading(false);
    }
  };

  const incrementGuestMessageCount = async (): Promise<void> => {
    if (!isGuest) return;

    const newCount = guestMessageCount + 1;
    setGuestMessageCount(newCount); // Optimistic update
    try {
      await AsyncStorage.setItem(GUEST_MESSAGE_COUNT_KEY, newCount.toString());
    } catch (error) {
      console.error('Error saving incremented guest message count:', error);
      // Optionally revert optimistic update or notify user
      // setGuestMessageCount(newCount - 1);
    }
  };

  const shouldShowSubscriptionOffer = async (): Promise<boolean> => {
    if (!isGuest || offerShown) {
        return false; // Not a guest or offer already shown this session
    }

    if (guestMessageCount >= OFFER_THRESHOLD) {
      try {
        // Double-check storage in case component re-renders before state updates
        const storedOfferShown = await AsyncStorage.getItem(OFFER_SHOWN_KEY);
        if (!storedOfferShown) {
          // Mark the offer as shown in storage *before* returning true
          await AsyncStorage.setItem(OFFER_SHOWN_KEY, 'true');
          setOfferShown(true); // Update state
          return true;
        } else {
            // Storage indicates it was shown, update state if it's lagging
            if (!offerShown) setOfferShown(true);
            return false;
        }
      } catch (error) {
        console.error('Error checking/setting subscription offer shown flag:', error);
        return false; // Don't show offer if there's an error
      }
    }

    return false;
  };

  // This function's logic seems incomplete based on the removed state.
  // It currently always returns true for guests. Preserving this behavior.
  const shouldShowDiscountOffer = async (): Promise<boolean> => {
    return isGuest; // Original logic: always true for guests
  };

  // This function now does nothing related to date tracking,
  // as the corresponding state and storage key were removed.
  // Kept for API compatibility.
  const markDiscountOfferShown = async (): Promise<void> => {
    if (!isGuest) return;
    // Original logic involved setting DISCOUNT_OFFER_LAST_SHOWN_KEY.
    // Since that state/key was unused and removed, this function is now a no-op for guests.
    console.log('markDiscountOfferShown called for guest (currently no-op)');
    // No state to set, no storage item to write for discount offer date.
  };

  // Memoize the context value to prevent unnecessary re-renders of consumers
  // when the provider's internal state changes but the exposed value object reference remains the same.
  const value = useMemo(() => ({
    user,
    session,
    isLoading,
    isGuest,
    guestMessageCount,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    signInWithApple,
    signInWithGoogle,
    skipAuth,
    incrementGuestMessageCount,
    shouldShowSubscriptionOffer,
    shouldShowDiscountOffer,
    markDiscountOfferShown,
  }), [user, session, isLoading, isGuest, guestMessageCount]); // Add dependencies

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the hook for components to use
export const useAuth = (): AuthContextInterface => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};
