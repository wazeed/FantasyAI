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
    <LinearGradient 
      colors={['#121212', '#1E1E1E']} 
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          {/* Header Section */}
          <Animated.View 
            style={[
              styles.headerContent,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logo} 
              resizeMode="contain"
            />
            <Text style={styles.greeting}>Welcome to FantasyAI</Text>
            <Text style={styles.subGreeting}>Chat with your favorite characters</Text>
          </Animated.View>

          {/* Error message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          {/* Footer with buttons */}
          <Animated.View 
            style={[
              styles.footerContent,
              { 
                opacity: fadeAnim
              }
            ]}
          >
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
            
            {/* Sign up and forgot password links */}
            <View style={styles.linksContainer}>
              <TouchableOpacity onPress={navigateToSignUp}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
              
              <Text style={styles.linkSeparator}>•</Text>
              
              <TouchableOpacity>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
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
    justifyContent: 'space-between',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: height * 0.1,
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  subGreeting: {
    fontSize: 16,
    color: '#BBBBBB',
    textAlign: 'center',
  },
  footerContent: {
    marginBottom: Platform.OS === 'ios' ? 30 : 20,
    width: '100%',
  },
  socialButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  guestButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '500',
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupLink: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  linkSeparator: {
    color: '#BBBBBB',
    marginHorizontal: 10,
    fontSize: 10,
  },
  forgotPasswordText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  errorContainer: {
    margin: 20,
    padding: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 8,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
  },
}); 