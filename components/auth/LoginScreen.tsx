import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  SafeAreaView 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface AuthButtonProps {
  icon: any;
  label: string;
  onPress: () => void;
}

const AuthButton = ({ icon, label, onPress }: AuthButtonProps) => (
  <TouchableOpacity 
    style={styles.authButton}
    onPress={onPress}
  >
    <Image source={icon} style={styles.buttonIcon} />
    <Text style={styles.buttonText}>{label}</Text>
  </TouchableOpacity>
);

export default function LoginScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Floating Character Avatars */}
      <View style={styles.avatarContainer}>
        <Image 
          source={require('../../assets/char1.png')} 
          style={[styles.avatar, { top: '10%', left: '20%' }]} 
        />
        <Image 
          source={require('../../assets/char2.png')} 
          style={[styles.avatar, { top: '30%', right: '15%' }]} 
        />
        <Image 
          source={require('../../assets/char3.png')} 
          style={[styles.avatar, { bottom: '25%', left: '30%' }]} 
        />
      </View>

      {/* Main Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Chat with millions of AI</Text>
        <Text style={styles.title}>Characters</Text>
      </View>

      {/* Auth Buttons */}
      <View style={styles.buttonContainer}>
        <AuthButton
          icon={require('../../assets/apple-icon.png')}
          label="Continue with Apple"
          onPress={() => {}}
        />
        <AuthButton
          icon={require('../../assets/google-icon.png')}
          label="Continue with Google"
          onPress={() => {}}
        />
        <AuthButton
          icon={require('../../assets/email-icon.png')}
          label="Continue with Email"
          onPress={() => {}}
        />
      </View>

      {/* Terms Text */}
      <Text style={styles.termsText}>
        By continuing, you agree to our{' '}
        <Text style={styles.linkText}>Terms</Text> and acknowledge our{' '}
        <Text style={styles.linkText}>Privacy Policy</Text>
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  avatarContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  avatar: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  titleContainer: {
    marginTop: '40%',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 12,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  buttonIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  termsText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  linkText: {
    color: '#fff',
    textDecorationLine: 'underline',
  },
});