import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ImageBackground,
  Animated,
  ImageSourcePropType, // Import ImageSourcePropType
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface AuthButtonProps {
  icon: ImageSourcePropType; // Use specific type
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
  // Animation setup for avatars
  const avatarAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;

  useEffect(() => {
    const createFloatAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: -10, // Float up
            duration: 3000 + Math.random() * 1000,
            delay: delay,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0, // Float down
            duration: 3000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animations = avatarAnims.map((anim, index) => createFloatAnimation(anim, index * 500));
    Animated.parallel(animations).start();

    // Cleanup function to stop animations when the component unmounts
    return () => animations.forEach(anim => anim.stop());
  }, [avatarAnims]);

  return (
    <ImageBackground
      source={require('../../assets/chat-bg/pattern2.png')} // Example: Use stars pattern
      style={styles.background}
      imageStyle={styles.backgroundImage} // Style for the image itself
    >
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        
        {/* Floating Character Avatars - Apply animation */}
        <View style={styles.avatarContainer}>
          <Animated.Image
            source={require('../../assets/char1.png')}
            style={[
              styles.avatar,
              { top: '10%', left: '20%' },
              { transform: [{ translateY: avatarAnims[0] }] } // Apply animation
            ]}
          />
          <Animated.Image
            source={require('../../assets/char2.png')}
            style={[
              styles.avatar,
              { top: '30%', right: '15%' },
              { transform: [{ translateY: avatarAnims[1] }] } // Apply animation
            ]}
          />
          <Animated.Image
            source={require('../../assets/char3.png')}
            style={[
              styles.avatar,
              { bottom: '25%', left: '30%' },
              { transform: [{ translateY: avatarAnims[2] }] } // Apply animation
            ]}
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.1, // Make background subtle
  },
  container: {
    flex: 1,
    // Remove solid background color to let ImageBackground show
    // backgroundColor: '#1A1A1A',
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
    fontSize: 32, // Increase font size
    color: 'white',
    fontWeight: '700', // Bolder weight
    textAlign: 'center',
    // Add a subtle text shadow for depth
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 12,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Slightly transparent white
    paddingVertical: 14, // Adjust padding
    paddingHorizontal: 20,
    borderRadius: 16, // Slightly more rounded
    width: '100%',
    // Add a subtle shadow for depth
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonIcon: {
    width: 24,
    height: 24,
    marginRight: 12, // Keep adjusted spacing
  },
  buttonText: {
    fontSize: 16,
    color: '#333', // Slightly softer dark color
    fontWeight: '600', // Make slightly bolder
    flex: 1, // Allow text to take remaining space
    textAlign: 'center', // Center text within the button
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