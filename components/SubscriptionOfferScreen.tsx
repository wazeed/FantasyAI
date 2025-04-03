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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack'; // Assuming Stack is used here, not NativeStack
import { ThemeContext } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

// Placeholder for navigation types - should be defined centrally
type RootStackParamList = {
  SubscriptionScreen: { isSpecialOffer: boolean };
  [key: string]: any; // Allow other routes
};

const { width } = Dimensions.get('window');

// --- Constants ---
const INITIAL_MINUTES = 52;
const FEATURES = [
  { icon: 'infinite-outline' as keyof typeof Ionicons.glyphMap, text: 'Unlimited answers from AI' },
  { icon: 'people-outline' as keyof typeof Ionicons.glyphMap, text: 'Access to all AI characters' },
  { icon: 'create-outline' as keyof typeof Ionicons.glyphMap, text: 'Create your own chatbots' },
  { icon: 'flash-outline' as keyof typeof Ionicons.glyphMap, text: 'Powered by ChatGPT & GPT-4' },
];

// --- Main Component ---

const SubscriptionOfferScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  // isDarkMode is fetched but not used, styles are hardcoded for this screen's design.
  // const { isDarkMode } = useContext(ThemeContext);
  
  // Countdown timer
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
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [minutes, seconds]);

  const handleRedeemOffer = () => {
    navigation.navigate('SubscriptionScreen', { isSpecialOffer: true });
  };

  const handleSkip = () => {
    navigation.goBack();
  };

  // Gradient colors are hardcoded, assuming intentional design for this specific offer screen.
  const gradientColors = ['#4F46E5', '#8B5CF6', '#EC4899'] as const;
  // Removed unused 'colors' object derived from ThemeContext.

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
          <Text style={styles.discountText}>50% OFF</Text>
          <Text style={styles.discountSubtext}>For a limited time only</Text>
        </View>

        {/* Countdown Timer */}
        <CountdownTimerDisplay minutes={minutes} seconds={seconds} />

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Get Premium and unlock:</Text>
          
          {/* Feature List */}
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
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  offerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
  },
  discountBadge: {
    alignItems: 'center',
    marginVertical: 20,
  },
  discountImage: {
    width: 200,
    height: 200,
    position: 'absolute',
  },
  discountText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 70,
  },
  discountSubtext: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginTop: 8,
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  timerLabel: {
    fontSize: 18,
    color: 'white',
    marginBottom: 8,
  },
  timerValue: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  featuresContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 18,
    color: 'white',
    flex: 1,
  },
  redeemButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  redeemButtonText: {
    color: '#4F46E5',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

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
    <Ionicons name={icon} size={24} color="white" style={styles.featureIcon} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
));

// --- Exports ---
export { SubscriptionOfferScreen }; // Named export
export default SubscriptionOfferScreen;