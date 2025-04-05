import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
// Use NativeStackNavigationProp as defined in the central types
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// Import the centrally defined RootStackParamList
import { RootStackParamList } from '../../types/navigation'; // Using relative path

// Specific navigation prop type for this screen, using the imported types
// Note: WelcomeScreen itself isn't listed in RootStackParamList, but it navigates TO 'EmailSignIn' which is.
// We need the prop type for the navigator that *contains* this screen. Assuming it's part of the RootStack.
// The original code navigated to 'SignUp', which isn't in the central type. It seems 'EmailSignIn' with a flag is used for sign up.
// Let's adjust the navigation target based on the central types.
type WelcomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EmailSignIn'>;

/**
 * WelcomeScreen Component: The initial screen shown to new users.
 * Provides an option to navigate to the Sign Up flow.
 */
export function WelcomeScreen() {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();

  // Navigate to the Email Sign In screen, flagging it as a Sign Up flow
  const handleGetStarted = () => {
    // Navigating to EmailSignIn with isSignUp: true based on RootStackParamList
    navigation.navigate('EmailSignIn', { isSignUp: true });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.headline}>Welcome to FantasyAI</Text>
        <Text style={styles.description}>
          Start chatting with AI characters instantly
        </Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles remain unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headline: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 18,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#121212',
  },
});