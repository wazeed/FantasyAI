import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  Animated,
  StatusBar,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { logError } from '../services/loggingService'; // Assuming a logging service exists
const logError = (message: string, error?: any) => console.error(message, error); // Placeholder

// Placeholder for navigation types - should be defined centrally
type RootStackParamList = {
  [key: string]: any; // Allow other routes
};

// Constants
const FADE_ANIMATION_DURATION = 800;
const SHAKE_ANIMATION_DURATION = 50;
const MIN_PASSWORD_LENGTH = 6;

// Define interfaces for navigation and component props
interface EmailSignInProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  route?: {
    params?: {
      isSignUp?: boolean;
    };
  };
}

const { width } = Dimensions.get('window');

// --- Helper Functions ---

// Convert technical error messages to user-friendly ones
const beautifyErrorMessage = (errorMsg: string): string => {
  if (errorMsg.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (errorMsg.includes('already registered')) {
    return 'Email already in use. Try signing in instead.';
  }
  if (errorMsg.includes('network')) {
    return 'Network error. Please check your connection.';
  }
  if (errorMsg.includes('Rate')) {
    return 'Too many attempts. Please try again later.';
  }
  // Consider adding more specific checks based on observed errors
  return 'An unexpected error occurred. Please try again.'; // Generic fallback
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  return password.length >= MIN_PASSWORD_LENGTH;
};

// --- Theme Colors (defined outside component) ---
const getThemeColors = (isDarkMode: boolean) => ({
  background: isDarkMode ? '#121212' : '#FFFFFF',
  card: isDarkMode ? '#1A1A1A' : '#F8F8F8',
  text: isDarkMode ? '#FFFFFF' : '#000000',
  subText: isDarkMode ? '#AAAAAA' : '#666666',
  inputBg: isDarkMode ? '#222222' : '#F5F5F5',
  inputText: isDarkMode ? '#FFFFFF' : '#000000',
  inputPlaceholder: isDarkMode ? '#777777' : '#AAAAAA',
  inputBorder: isDarkMode ? '#333333' : '#E5E5E5',
  buttonBg: isDarkMode ? '#333333' : '#000000',
  buttonText: isDarkMode ? '#FFFFFF' : '#FFFFFF',
  buttonDisabled: isDarkMode ? '#222222' : '#CCCCCC',
  error: '#FF3B30', // iOS red
  success: '#34C759', // iOS green
  accent: '#007AFF', // iOS blue
});

// --- Main Component ---

function EmailSignInComponent({ navigation, route }: EmailSignInProps) {
  // Get initial mode from route params or default to signin
  const initialMode = route?.params?.isSignUp ? 'signup' : 'signin';
  const { signIn, signUp } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  const colors = getThemeColors(isDarkMode); // Get themed colors
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [showSuccess, setShowSuccess] = useState(false);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const shakeAnim = useState(new Animated.Value(0))[0];

  // Removed internal colors object, now fetched via getThemeColors

  useEffect(() => {
    // Fade in animation for form
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: FADE_ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  }, []);

  // Validation functions moved outside component

  const clearInputs = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: SHAKE_ANIMATION_DURATION, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: SHAKE_ANIMATION_DURATION, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: SHAKE_ANIMATION_DURATION, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: SHAKE_ANIMATION_DURATION, useNativeDriver: true })
    ]).start();
  };

  const handleSubmit = async () => {
    setError(null);

    // Validate inputs
    if (!email || !password) {
      setError('Please enter both email and password');
      shakeError();
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      shakeError();
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters long');
      shakeError();
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      shakeError();
      return;
    }

    setLoading(true);

    try {
      let result;
      
      if (mode === 'signin') {
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password);
        
        // Special handling for Supabase email confirmation flow
        if (result.success && !result.error) {
          setShowSuccess(true);
          clearInputs();
          // Show confirmation alert if signup was successful
          Alert.alert(
            "Account Created",
            "Your account has been created successfully. Please check your email for confirmation.",
            [{ text: "OK", onPress: () => setMode('signin') }]
          );
        }
      }

      if (!result.success && result.error) {
        const errorMessage = beautifyErrorMessage(result.error);
        setError(errorMessage);
        shakeError();
      }
    } catch (err) {
      const errorToLog = err instanceof Error ? err : new Error(String(err));
      logError(`Auth error during ${mode}:`, errorToLog);
      setError(beautifyErrorMessage(errorToLog.message || 'An unknown error occurred.'));
      shakeError();
    } finally {
      setLoading(false);
    }
  };

  // beautifyErrorMessage moved outside component

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
    clearInputs();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={isDarkMode ? ['#121212', '#1A1A1A'] : ['#FFFFFF', '#F8F8F8']}
          style={styles.gradientBackground}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons 
                  name="chevron-back" 
                  size={28} 
                  color={colors.text}
                />
              </TouchableOpacity>
              
              <Animated.View 
                style={[
                  styles.formContainer, 
                  { opacity: fadeAnim, transform: [{ translateX: shakeAnim }] }
                ]}
              >
                <Text style={[styles.title, { color: colors.text }]}>
                  {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
                </Text>
                
                <Text style={[styles.subtitle, { color: colors.subText }]}>
                  {mode === 'signin' 
                    ? 'Sign in to continue your chat journey' 
                    : 'Join the conversation with AI characters'}
                </Text>

                {/* Error and Success Messages */}
                <ErrorMessageDisplay error={error} colors={colors} isDarkMode={isDarkMode} />
                <SuccessMessageDisplay showSuccess={showSuccess} colors={colors} isDarkMode={isDarkMode} />

                {/* Email Input */}
                <AuthInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  icon="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  colors={colors}
                />

                {/* Password Input */}
                <AuthInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  icon="lock-closed-outline"
                  secureTextEntry
                  colors={colors}
                />

                {mode === 'signup' && (
                  <AuthInput
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm your password"
                    icon="lock-closed-outline"
                    secureTextEntry
                    colors={colors}
                  />
                )}

                {/* Submit Button */}
                <AuthButton
                  title={mode === 'signin' ? 'Sign In' : 'Create Account'}
                  onPress={handleSubmit}
                  loading={loading}
                  colors={colors}
                />

                {/* Mode Toggle */}
                <AuthModeToggle
                  mode={mode}
                  onToggle={toggleMode}
                  colors={colors}
                />
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </SafeAreaView>
    </View>
  );
}

// --- Subcomponents ---

interface AuthInputProps extends React.ComponentProps<typeof TextInput> {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: ReturnType<typeof getThemeColors>;
}

const AuthInput: React.FC<AuthInputProps> = ({ label, icon, colors, ...props }) => (
  <View style={styles.inputContainer}>
    <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
    <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
      <Ionicons name={icon} size={20} color={colors.subText} style={styles.inputIcon} />
      <TextInput
        style={[styles.input, { color: colors.inputText }]}
        placeholderTextColor={colors.inputPlaceholder}
        {...props}
      />
    </View>
  </View>
);

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  loading: boolean;
  colors: ReturnType<typeof getThemeColors>;
}

const AuthButton: React.FC<AuthButtonProps> = ({ title, onPress, loading, colors }) => (
  <TouchableOpacity
    style={[
      styles.submitButton,
      { backgroundColor: loading ? colors.buttonDisabled : colors.buttonBg }
    ]}
    onPress={onPress}
    disabled={loading}
    activeOpacity={0.7}
  >
    {loading ? (
      <ActivityIndicator color={colors.buttonText} size="small" />
    ) : (
      <Text style={[styles.submitButtonText, { color: colors.buttonText }]}>
        {title}
      </Text>
    )}
  </TouchableOpacity>
);

interface AuthModeToggleProps {
  mode: 'signin' | 'signup';
  onToggle: () => void;
  colors: ReturnType<typeof getThemeColors>;
}

const AuthModeToggle: React.FC<AuthModeToggleProps> = ({ mode, onToggle, colors }) => (
  <View style={styles.switchModeContainer}>
    <Text style={[styles.switchModeText, { color: colors.subText }]}>
      {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
    </Text>
    <TouchableOpacity onPress={onToggle}>
      <Text style={[styles.switchModeLink, { color: colors.accent }]}>
        {mode === 'signin' ? 'Sign Up' : 'Sign In'}
      </Text>
    </TouchableOpacity>
  </View>
);

interface ErrorMessageDisplayProps {
  error: string | null;
  colors: ReturnType<typeof getThemeColors>;
  isDarkMode: boolean;
}

const ErrorMessageDisplay: React.FC<ErrorMessageDisplayProps> = ({ error, colors, isDarkMode }) => {
  if (!error) return null;
  return (
    <View style={[styles.errorContainer, { backgroundColor: isDarkMode ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255, 59, 48, 0.05)' }]}>
      <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
      <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
    </View>
  );
};

interface SuccessMessageDisplayProps {
  showSuccess: boolean;
  colors: ReturnType<typeof getThemeColors>;
  isDarkMode: boolean;
}

const SuccessMessageDisplay: React.FC<SuccessMessageDisplayProps> = ({ showSuccess, colors, isDarkMode }) => {
  if (!showSuccess) return null;
  return (
    <View style={[styles.successContainer, { backgroundColor: isDarkMode ? 'rgba(52, 199, 89, 0.1)' : 'rgba(52, 199, 89, 0.05)' }]}>
      <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
      <Text style={[styles.successText, { color: colors.success }]}>
        Account created! Check your email for confirmation.
      </Text>
    </View>
  );
};

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    width: '100%',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backButton: {
    marginTop: 16,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    flex: 1,
    marginTop: 12,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 20,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  subtitle: {
    fontSize: 17,
    letterSpacing: -0.5,
    marginBottom: 30,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 20,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 15, // Slightly larger for readability
    marginLeft: 10,
    fontWeight: '500',
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 20,
    borderRadius: 12,
  },
  successText: {
    fontSize: 15, // Slightly larger for readability
    marginLeft: 10,
    fontWeight: '500',
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  switchModeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  switchModeText: {
    fontSize: 15,
    marginRight: 5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  switchModeLink: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});

// --- Exports ---
export { EmailSignInComponent as EmailSignIn }; // Named export
export default EmailSignInComponent; // Default export