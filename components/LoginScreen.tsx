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

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { signInWithApple, signInWithGoogle, skipAuth } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
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

  const handleEmailSignIn = () => {
    navigation.navigate('EmailSignIn', { isSignUp: false });
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

  const navigateToSignUp = () => {
    navigation.navigate('EmailSignIn', { isSignUp: true });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          <Animated.View 
            style={[
              styles.mainContent,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Greeting */}
            <Text style={styles.greeting}>Hi!</Text>
            
            {/* Social sign-in buttons */}
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handleGoogleSignIn}
              disabled={loading !== null}
            >
              {loading === 'google' ? (
                <ActivityIndicator color="#121212" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={22} color="#DB4437" style={styles.socialIcon} />
                  <Text style={styles.socialButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handleAppleSignIn}
              disabled={loading !== null}
            >
              {loading === 'apple' ? (
                <ActivityIndicator color="#121212" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={22} color="#000000" style={styles.socialIcon} />
                  <Text style={styles.socialButtonText}>Continue with Apple</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handleEmailSignIn}
              disabled={loading !== null}
            >
              <Ionicons name="mail" size={22} color="#4285F4" style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Continue with Email</Text>
            </TouchableOpacity>
            
            {/* Sign up link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>
                Don't have an account? <Text style={styles.signupLink} onPress={navigateToSignUp}>Sign up</Text>
              </Text>
            </View>
            
            {/* Forgot password link */}
            <TouchableOpacity style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
            </TouchableOpacity>
            
            {/* Guest mode button */}
            <TouchableOpacity 
              style={styles.guestButton}
              onPress={handleSkipAuth}
              disabled={loading !== null}
            >
              {loading === 'skip' ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.guestButtonText}>Enter as Guest</Text>
              )}
            </TouchableOpacity>
            
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 30,
  },
  socialButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginBottom: 12,
  },
  socialIcon: {
    marginRight: 10,
  },
  socialButtonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: '500',
  },
  guestButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  guestButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '500',
  },
  signupContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  signupText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  signupLink: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  forgotPasswordContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  errorContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 5,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
  },
}); 