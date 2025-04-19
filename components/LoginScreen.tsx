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
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { useOnboarding } from '../contexts/OnboardingContext'; // Add this import
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack'; // Import StackNavigationProp

// Define navigation param list for the Auth stack
type AuthStackParamList = {
  Login: undefined;
  EmailSignIn: { isSignUp: boolean };
  // Add other auth-related screens if needed
};

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const { width, height } = Dimensions.get('window');

// Define colors based on the image
const colors = {
  background: '#0D0D0D', // Very dark background
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA', // Lighter grey for subtitle
  buttonTextPrimary: '#000000', // Black text for social buttons
  buttonBackgroundPrimary: '#FFFFFF',
  guestButtonBorder: '#2ECC71', // Brighter green border
  guestButtonText: '#2ECC71', // Brighter green text
  linkText: '#2ECC71', // Brighter green for links
  iconGoogle: '#DB4437',
  iconApple: '#000000',
  iconEmail: '#4285F4', // Example color, adjust if needed
  errorText: '#FF3B30',
  errorBackground: 'rgba(255, 0, 0, 0.1)',
};

export default function LoginScreen({ navigation }: { navigation: LoginScreenNavigationProp }) { // Add type annotation
  const { signInWithApple, signInWithGoogle, skipAuth } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  const { resetOnboarding } = useOnboarding(); // Add this line to get resetOnboarding function
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

  // Handler to reset onboarding state (for developers)
  const handleResetOnboarding = () => {
    Alert.alert(
      "Reset Onboarding",
      "Are you sure you want to reset the onboarding process? You will see the onboarding screens again next time you open the app.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Reset",
          onPress: async () => {
            await resetOnboarding();
            Alert.alert("Success", "Onboarding has been reset. Restart the app to see the onboarding screens.");
          },
          style: "destructive"
        }
      ]
    );
  };

  return (
    // Use a View with solid background color instead of LinearGradient
    <View style={styles.container}>
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
            {/* Consider adding a glow effect view behind the logo if possible */}
            <View style={styles.logoContainer}>
              <Image
                // Using the crystal ball asset as requested
                source={require('../assets/crystalball.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
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
                <ActivityIndicator color={colors.buttonTextPrimary} size="small" />
              ) : (
                <>
                  {/* Using Ionicons, replace with actual Google logo image if needed */}
                  <Ionicons name="logo-google" size={22} color={colors.iconGoogle} style={styles.socialIcon} />
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
                <ActivityIndicator color={colors.buttonTextPrimary} size="small" />
              ) : (
                <>
                 {/* Using Ionicons, replace with actual Apple logo image if needed */}
                  <Ionicons name="logo-apple" size={24} color={colors.iconApple} style={styles.socialIcon} />
                  <Text style={styles.socialButtonText}>Continue with Apple</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleEmailSignIn}
              disabled={loading !== null}
            >
               {/* Using Ionicons for email */}
              <Ionicons name="mail-outline" size={22} color={colors.iconEmail} style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Continue with Email</Text>
            </TouchableOpacity>

            {/* Guest mode button */}
            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleSkipAuth}
              disabled={loading !== null}
            >
              {loading === 'skip' ? (
                <ActivityIndicator color={colors.guestButtonText} size="small" />
              ) : (
                <Text style={styles.guestButtonText}>Enter as Guest</Text>
              )}
            </TouchableOpacity>

            {/* Sign up and forgot password links */}
            <View style={styles.linksContainer}>
              <TouchableOpacity onPress={navigateToSignUp}>
                <Text style={styles.linkText}>Sign up</Text>
              </TouchableOpacity>

              <Text style={styles.linkSeparator}>•</Text>

              {/* Add navigation for Forgot Password if needed */}
              <TouchableOpacity>
                <Text style={styles.linkText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
            
            {/* Developer option to reset onboarding */}
            <TouchableOpacity 
              style={styles.devOptionButton}
              onPress={handleResetOnboarding}
            >
              <Text style={styles.devOptionText}>
                <Ionicons name="refresh-outline" size={14} color={colors.textSecondary} /> Reset Onboarding (Dev)
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View> // Close the main View container
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Use defined background color
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 25, // Slightly increased padding
    justifyContent: 'space-between', // Keep space-between
    paddingBottom: Platform.OS === 'ios' ? 10 : 20, // Adjust bottom padding
  },
  headerContent: {
    alignItems: 'center',
    marginTop: height * 0.12, // Adjust top margin
    flex: 1, // Allow header to take available space
    justifyContent: 'center', // Center content vertically within header space
  },
  logoContainer: { // Optional container for potential glow effect
    marginBottom: 30, // Increased space below logo
    // Add shadow/glow styles here if attempting effect
    width: width * 0.35, // Adjust size as needed
    height: width * 0.35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  greeting: {
    fontSize: 32, // Slightly larger font size
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8, // Reduced space
    textAlign: 'center',
  },
  subGreeting: {
    fontSize: 16,
    color: colors.textSecondary, // Use defined secondary text color
    textAlign: 'center',
    marginBottom: 20, // Add some margin below subtitle
  },
  footerContent: {
    // Removed marginBottom, rely on contentContainer paddingBottom
    width: '100%',
    paddingBottom: 10, // Add padding at the bottom of the footer itself
  },
  socialButton: {
    backgroundColor: colors.buttonBackgroundPrimary, // Use defined button background
    borderRadius: 25, // More rounded corners like the image
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center content inside button
    paddingVertical: 15, // Adjust padding
    paddingHorizontal: 20,
    marginBottom: 15, // Increased spacing between buttons
    // Remove elevation/shadow if not desired
    // elevation: 2,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.1,
    // shadowRadius: 2,
  },
  socialIcon: {
    marginRight: 12, // Adjust spacing
  },
  socialButtonText: {
    color: colors.buttonTextPrimary, // Use defined button text color
    fontSize: 16,
    fontWeight: '500', // Medium weight
  },
  guestButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5, // Slightly thicker border
    borderColor: colors.guestButtonBorder, // Use defined border color
    borderRadius: 25, // Match social buttons rounding
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10, // Space above guest button
    marginBottom: 25, // Space below guest button
  },
  guestButtonText: {
    color: colors.guestButtonText, // Use defined guest button text color
    fontSize: 16,
    fontWeight: '500',
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 10, // Ensure links aren't too close to the edge
  },
  linkText: { // Combined style for both links
    color: colors.linkText, // Use defined link color
    fontSize: 14,
    fontWeight: '500', // Medium weight
  },
  linkSeparator: {
    color: colors.textSecondary, // Use secondary text color for separator
    marginHorizontal: 8,
    fontSize: 14, // Match link font size
  },
  // Keep error styles
  errorContainer: {
    marginHorizontal: 20,
    marginBottom: 15, // Position error above buttons
    padding: 12,
    backgroundColor: colors.errorBackground,
    borderRadius: 8,
  },
  errorText: {
    color: colors.errorText,
    textAlign: 'center',
    fontSize: 14,
  },
  // Add styles for dev options
  devOptionButton: {
    marginTop: 20,
    alignSelf: 'center',
    padding: 10,
  },
  devOptionText: {
    fontSize: 12,
    color: colors.textSecondary,
    opacity: 0.7,
    textAlign: 'center',
  }
});