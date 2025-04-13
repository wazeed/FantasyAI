import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  SafeAreaView, // Use SafeAreaView for better handling of notches/status bars
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
// Removed unused ThemeContext import
import { Ionicons } from '@expo/vector-icons';

// --- Types ---
// Placeholder for navigation types - should be defined centrally
type RootStackParamList = {
  SubscriptionScreen: { isSpecialOffer: boolean };
  [key: string]: any; // Allow other routes
};

type ScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SubscriptionOfferScreen'>;

const { width, height } = Dimensions.get('window'); // Get height as well for potential responsive adjustments

// --- Constants ---
const INITIAL_MINUTES = 52;
const FEATURES = [
  { icon: 'infinite-outline' as keyof typeof Ionicons.glyphMap, text: 'Unlimited answers from AI' },
  { icon: 'people-outline' as keyof typeof Ionicons.glyphMap, text: 'Access to all AI characters' },
  { icon: 'create-outline' as keyof typeof Ionicons.glyphMap, text: 'Create your own chatbots' },
  { icon: 'flash-outline' as keyof typeof Ionicons.glyphMap, text: 'Powered by ChatGPT & GPT-4' },
];
const GRADIENT_COLORS = ['#4F46E5', '#8B5CF6', '#EC4899'] as const;

// --- Main Component ---

export const SubscriptionOfferScreen: React.FC = () => {
  const navigation = useNavigation<ScreenNavigationProp>();
  const [minutes, setMinutes] = useState(INITIAL_MINUTES);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (seconds > 0) {
        setSeconds(seconds - 1);
      } else if (minutes > 0) {
        setMinutes(minutes - 1);
        setSeconds(59);
      } else {
        clearInterval(timer);
        // Optionally handle timer expiration visually
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [minutes, seconds]);

  const handleRedeemOffer = () => {
    navigation.navigate('SubscriptionScreen', { isSpecialOffer: true });
  };

  const handleSkip = () => {
    // Consider navigation.pop() or a more specific back action if appropriate
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={GRADIENT_COLORS}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      {/* Use SafeAreaView to avoid overlap with status bar/notches */}
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.offerTitle}>One-time Special Offer</Text>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.discountBadge}>
            <Image
              source={require('../assets/discount-badge.png')}
              style={styles.discountImage}
              resizeMode="contain"
            />
            {/* Text positioned relative to the container now */}
            <Text style={styles.discountText}>50% OFF</Text>
            <Text style={styles.discountSubtext}>For a limited time only</Text>
          </View>

          <CountdownTimerDisplay minutes={minutes} seconds={seconds} />

          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Get Premium and unlock:</Text>
            {FEATURES.map((feature, index) => (
              <FeatureItem key={index} icon={feature.icon} text={feature.text} />
            ))}
          </View>

          <TouchableOpacity
            style={styles.redeemButton}
            onPress={handleRedeemOffer}
            activeOpacity={0.8}
          >
            <Text style={styles.redeemButtonText}>Redeem 50% Discount</Text>
          </TouchableOpacity>

          {/* Add some bottom padding for scroll */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

// --- Subcomponents ---

interface CountdownTimerDisplayProps {
  minutes: number;
  seconds: number;
}

const CountdownTimerDisplay: React.FC<CountdownTimerDisplayProps> = React.memo(({ minutes, seconds }) => (
  <View style={styles.timerContainer}>
    <Text style={styles.timerLabel}>Offer expires in:</Text>
    <View style={styles.timerValue}>
      <Text style={styles.timerText}>
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </Text>
    </View>
  </View>
));

interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

const FeatureItem: React.FC<FeatureItemProps> = React.memo(({ icon, text }) => (
  <View style={styles.featureItem}>
    <Ionicons name={icon} size={26} color="white" style={styles.featureIcon} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
));

// --- Styles ---

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    // SafeAreaView handles top padding on iOS automatically
    // Add manual top padding for Android status bar if needed
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24, // Consistent horizontal padding
    paddingBottom: 40, // Ensure space at the bottom
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10, // Reduced top margin as SafeAreaView handles some spacing
    marginBottom: 30, // Increased spacing below header
  },
  offerTitle: {
    fontSize: width > 375 ? 30 : 26, // Slightly responsive font size
    fontWeight: 'bold',
    color: 'white',
    flexShrink: 1, // Allow title to shrink if needed
    marginRight: 10, // Space between title and skip button
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12, // Slightly larger touch area
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Subtle background
  },
  skipText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },
  discountBadge: {
    alignItems: 'center',
    justifyContent: 'center', // Center content vertically
    marginVertical: 30, // Increased vertical spacing
    position: 'relative', // Use relative positioning for content inside
    height: 220, // Fixed height to contain image and text consistently
    width: '100%', // Take full width for centering
  },
  discountImage: {
    width: '100%', // Let image scale within the container
    maxWidth: 220, // Max width for the image
    height: 220, // Match container height
    position: 'absolute', // Position behind text
    opacity: 0.9,
  },
  discountText: {
    fontSize: width > 375 ? 48 : 42, // Responsive size
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    zIndex: 1, // Ensure text is above image
    textShadowColor: 'rgba(0, 0, 0, 0.2)', // Subtle shadow for readability
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  discountSubtext: {
    fontSize: 17, // Slightly larger
    color: 'white',
    opacity: 0.9,
    marginTop: 10, // Increased spacing
    textAlign: 'center',
    zIndex: 1, // Ensure text is above image
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 30, // Consistent vertical spacing
  },
  timerLabel: {
    fontSize: 18,
    color: 'white',
    opacity: 0.9,
    marginBottom: 12, // Increased spacing
  },
  timerValue: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Darker background for contrast
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  timerText: {
    fontSize: 32, // Larger timer text
    fontWeight: 'bold',
    color: 'white',
    fontVariant: ['tabular-nums'], // Ensure consistent character width
  },
  featuresContainer: {
    marginTop: 20, // Adjusted spacing
    marginBottom: 40, // Increased spacing before button
  },
  featuresTitle: {
    fontSize: 24, // Larger title
    fontWeight: '600', // Semi-bold
    color: 'white',
    marginBottom: 24, // Increased spacing
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18, // Increased spacing between items
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Slightly less transparent
    paddingVertical: 18, // Increased vertical padding
    paddingHorizontal: 20, // Increased horizontal padding
    borderRadius: 16, // More rounded corners
  },
  featureIcon: {
    marginRight: 16, // Increased spacing
  },
  featureText: {
    fontSize: 18, // Standardized size
    color: 'white',
    flex: 1, // Ensure text takes remaining space and wraps
    lineHeight: 24, // Improve readability for wrapped text
  },
  redeemButton: {
    backgroundColor: 'white',
    paddingVertical: 18, // Increased padding
    borderRadius: 16, // Match feature item rounding
    alignItems: 'center',
    marginTop: 10, // Spacing above button
    shadowColor: '#000', // Add subtle shadow for depth
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },
  redeemButtonText: {
    color: GRADIENT_COLORS[0], // Use start gradient color for consistency
    fontSize: 19, // Slightly larger
    fontWeight: 'bold',
  },
});

// --- Exports ---
// Keep both named and default for flexibility, though named is preferred per instructions
export default SubscriptionOfferScreen;