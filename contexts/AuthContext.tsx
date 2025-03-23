import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, signInWithEmail, signInWithProvider, signUpWithEmail, AuthProvider as SupabaseAuthProvider } from '../utils/supabase'
import { Session, User, Provider } from '@supabase/supabase-js'
import { AuthProvider } from '../utils/supabase'
import * as WebBrowser from 'expo-web-browser'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'

// Constants for guest message tracking
const GUEST_MESSAGE_COUNT_KEY = 'guest_message_count'
const OFFER_THRESHOLD = 3 // Show offer after this many messages
const OFFER_SHOWN_KEY = 'subscription_offer_shown'
const DISCOUNT_OFFER_LAST_SHOWN_KEY = 'discount_offer_last_shown_date'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  isGuest: boolean
  guestMessageCount: number
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  signInWithOAuth: (provider: Provider) => Promise<{ success: boolean; error?: string }>
  signInWithApple: () => Promise<{ success: boolean; error?: string }>
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>
  skipAuth: () => void
  incrementGuestMessageCount: () => Promise<void>
  shouldShowSubscriptionOffer: () => Promise<boolean>
  shouldShowDiscountOffer: () => Promise<boolean>
  markDiscountOfferShown: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const [guestMessageCount, setGuestMessageCount] = useState<number>(0)
  const [offerShown, setOfferShown] = useState(false)
  const [lastDiscountOfferDate, setLastDiscountOfferDate] = useState<string | null>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session) setIsGuest(false) // If we have a session, we're not a guest
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const loadUserSession = async () => {
      try {
        // Check if a user session exists
        const userString = await SecureStore.getItemAsync('user_session')
        if (userString) {
          const userData = JSON.parse(userString)
          setUser(userData)
        }

        // Check if guest mode is enabled
        const guestMode = await AsyncStorage.getItem('guest_mode')
        if (guestMode === 'true') {
          setIsGuest(true)
          
          // Load guest message count
          const countStr = await AsyncStorage.getItem(GUEST_MESSAGE_COUNT_KEY)
          if (countStr) {
            setGuestMessageCount(parseInt(countStr, 10))
          }
          
          // Load if offer has been shown
          const offerShownString = await AsyncStorage.getItem(OFFER_SHOWN_KEY)
          setOfferShown(offerShownString === 'true')
          
          // Load last discount offer shown date
          const lastDiscountDate = await AsyncStorage.getItem(DISCOUNT_OFFER_LAST_SHOWN_KEY)
          setLastDiscountOfferDate(lastDiscountDate)
        }
      } catch (error) {
        console.error('Error loading user session:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserSession()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      setIsGuest(false)
      return { success: true }
    } catch (error: any) {
      console.error('Sign in error:', error)
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during sign in',
      }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      setIsGuest(false)
      return { success: true }
    } catch (error: any) {
      console.error('Sign up error:', error)
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during sign up',
      }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setSession(null)
      setIsGuest(false)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const signInWithOAuth = async (provider: Provider) => {
    try {
      // Get the URL for OAuth sign-in
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'fantasyai://auth/callback',
        },
      })

      if (error) {
        return { success: false, error: error.message }
      }

      // Open the URL in a browser
      if (data?.url) {
        await WebBrowser.openAuthSessionAsync(data.url, 'fantasyai://auth/callback')
      }

      setIsGuest(false)
      // The session will be handled by the onAuthStateChange listener
      return { success: true }
    } catch (error: any) {
      console.error('OAuth sign in error:', error)
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during OAuth sign in',
      }
    }
  }

  const signInWithApple = async () => {
    return signInWithOAuth('apple' as Provider)
  }

  const signInWithGoogle = async () => {
    return signInWithOAuth('google' as Provider)
  }

  // Function to skip authentication and proceed as guest
  const skipAuth = () => {
    setIsGuest(true)
    setLoading(false)
  }

  // Function to increment guest message count
  const incrementGuestMessageCount = async () => {
    if (!isGuest) return
    
    try {
      const newCount = guestMessageCount + 1
      setGuestMessageCount(newCount)
      await AsyncStorage.setItem(GUEST_MESSAGE_COUNT_KEY, newCount.toString())
    } catch (error) {
      console.error('Error incrementing guest message count:', error)
    }
  }

  // Function to check if subscription offer should be shown
  const shouldShowSubscriptionOffer = async (): Promise<boolean> => {
    if (!isGuest) return false
    
    // Check if we've reached the threshold and haven't shown the offer yet
    if (guestMessageCount >= OFFER_THRESHOLD) {
      try {
        const offerShown = await AsyncStorage.getItem(OFFER_SHOWN_KEY)
        if (!offerShown) {
          // Mark the offer as shown so we don't show it again
          await AsyncStorage.setItem(OFFER_SHOWN_KEY, 'true')
          setOfferShown(true)
          return true
        }
      } catch (error) {
        console.error('Error checking if offer was shown:', error)
      }
    }
    
    return false
  }

  // Function to check if discount offer should be shown today
  const shouldShowDiscountOffer = async (): Promise<boolean> => {
    if (!isGuest) return false
    
    // Always show discount offer for guest users
    return true;
  }
  
  // Function to mark that the discount offer has been shown today
  const markDiscountOfferShown = async (): Promise<void> => {
    if (!isGuest) return
    
    try {
      const today = new Date().toISOString().split('T')[0]
      await AsyncStorage.setItem(DISCOUNT_OFFER_LAST_SHOWN_KEY, today)
      setLastDiscountOfferDate(today)
    } catch (error) {
      console.error('Error marking discount offer as shown:', error)
    }
  }

  // Watch for conditions to show offer
  useEffect(() => {
    if (shouldShowSubscriptionOffer()) {
      // Navigation would happen in component that uses this context
    }
  }, [guestMessageCount, isGuest, offerShown])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
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
        markDiscountOfferShown
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider')
  }
  return context
}