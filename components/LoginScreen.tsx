import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Platform,
  Animated,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';

const { width, height } = Dimensions.get('window');

// Mock character images with local require
const characters = [
  require('../assets/char1.png'),
  require('../assets/char2.png'),
  require('../assets/char3.png'),
];

export default function LoginScreen({ navigation }) {
  const { signInWithApple, signInWithGoogle, skipAuth } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  // Select a random character image
  const randomCharacter = characters[Math.floor(Math.random() * characters.length)];

  // Theme colors
  const colors = {
    background: isDarkMode ? '#121212' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    subText: isDarkMode ? '#AAAAAA' : '#666666',
    buttonBg: isDarkMode ? '#222222' : '#F6F6F6',
    buttonText: isDarkMode ? '#FFFFFF' : '#000000',
    appleButtonBg: isDarkMode ? '#FFFFFF' : '#000000',
    appleButtonText: isDarkMode ? '#000000' : '#FFFFFF',
    border: isDarkMode ? '#333333' : '#EEEEEE',
    accent: '#007AFF', // iOS blue
    error: '#FF3B30', // iOS red
  };

  useEffect(() => {
    // Load custom fonts
    async function loadFonts() {
      try {
        // Removed the problematic font loading
        setFontsLoaded(true);
      } catch (err) {
        console.log('Font loading error:', err);
        setFontsLoaded(true); // Continue even if fonts fail to load
      }
    }
    
    loadFonts();
    
    // Run entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleAppleSignIn = async () => {
    try {
      setLoading('apple');
      setError(null);
      
      await signInWithApple();
    } catch (err) {
      handleAuthError(err, 'Apple');
    } finally {
      setLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading('google');
      setError(null);
      
      await signInWithGoogle();
    } catch (err) {
      handleAuthError(err, 'Google');
    } finally {
      setLoading(null);
    }
  };

  const handleSkipAuth = () => {
    setLoading('skip');
    // Short delay to show loading state
    setTimeout(() => {
      skipAuth();
    }, 500);
  };

  const handleAuthError = (err: any, provider: string) => {
    console.error(`${provider} sign-in error:`, err);
    
    if (err.message?.includes('canceled')) {
      setError(`${provider} sign-in was canceled.`);
    } else if (err.message?.includes('network')) {
      setError('Network error. Please check your connection.');
    } else {
      setError(`Unable to sign in with ${provider}. Please try again.`);
    }
    
    // Clear error after 5 seconds
    setTimeout(() => setError(null), 5000);
  };

  const navigateToEmailSignIn = (isSignUp = false) => {
    navigation.navigate('EmailSignIn', { isSignUp });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={isDarkMode ? ['#121212', '#1A1A1A'] : ['#FFFFFF', '#F8F8F8']}
          style={styles.gradientBackground}
        >
          <Animated.View 
            style={[
              styles.contentContainer, 
              { 
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            <Animated.View style={styles.logoContainer}>
              <Text style={[styles.appTitle, { color: colors.text }]}>Fantasy AI</Text>
              <Text style={[styles.tagline, { color: colors.subText }]}>Elegant conversations, endless possibilities</Text>
            </Animated.View>

            <View style={[styles.characterImageContainer, { borderColor: colors.border }]}>
              <LinearGradient
                colors={isDarkMode ? ['#1E1E1E', '#252525'] : ['#F9F9F9', '#FFFFFF']}
                style={styles.characterGradient}
              >
                <Image
                  source={randomCharacter}
                  style={styles.characterImage}
                  resizeMode="contain"
                />
              </LinearGradient>
            </View>

            {error && (
              <View style={[styles.errorContainer, { backgroundColor: isDarkMode ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255, 59, 48, 0.05)' }]}>
                <Ionicons name="alert-circle" size={20} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: colors.appleButtonBg, borderColor: colors.border }]}
                onPress={handleAppleSignIn}
                disabled={loading !== null}
              >
                {loading === 'apple' ? (
                  <ActivityIndicator color={colors.appleButtonText} size="small" />
                ) : (
                  <>
                    <Ionicons name="logo-apple" size={22} color={colors.appleButtonText} style={styles.buttonIcon} />
                    <Text style={[styles.socialButtonText, { color: colors.appleButtonText }]}>Sign in with Apple</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: colors.buttonBg, borderColor: colors.border }]}
                onPress={handleGoogleSignIn}
                disabled={loading !== null}
              >
                {loading === 'google' ? (
                  <ActivityIndicator color={colors.buttonText} size="small" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={22} color="#DB4437" style={styles.buttonIcon} />
                    <Text style={[styles.socialButtonText, { color: colors.buttonText }]}>
                      Sign in with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: colors.buttonBg, borderColor: colors.border }]}
                onPress={() => navigateToEmailSignIn(false)}
                disabled={loading !== null}
              >
                <Ionicons name="mail" size={22} color={colors.accent} style={styles.buttonIcon} />
                <Text style={[styles.socialButtonText, { color: colors.buttonText }]}>Sign in with Email</Text>
              </TouchableOpacity>

              <View style={styles.signupContainer}>
                <Text style={[styles.accountText, { color: colors.subText }]}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => navigateToEmailSignIn(true)}>
                  <Text style={[styles.signupText, { color: colors.accent }]}>Sign Up</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.skipButton, { borderColor: colors.border }]}
                onPress={handleSkipAuth}
                disabled={loading !== null}
              >
                {loading === 'skip' ? (
                  <ActivityIndicator color={colors.subText} size="small" />
                ) : (
                  <Text style={[styles.skipButtonText, { color: colors.subText }]}>Enter as Guest</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </LinearGradient>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    width: '100%',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  tagline: {
    fontSize: 17,
    letterSpacing: -0.5,
    fontWeight: '400',
    marginBottom: 15,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  characterImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    width: width * 0.8,
    height: width * 0.7,
  },
  characterGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterImage: {
    width: '90%',
    height: '90%',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 20,
    borderRadius: 12,
    width: '100%',
  },
  errorText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 54,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  signupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  accountText: {
    fontSize: 15,
    marginRight: 5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  signupText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  skipButton: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: 16,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
}); 