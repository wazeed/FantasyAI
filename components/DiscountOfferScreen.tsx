import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  SafeAreaView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ThemeContext } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

type DiscountOfferScreenProps = {
  route?: {
    params?: {
      fromCharacter?: boolean;
      character?: string;
    };
  };
};

const DiscountOfferScreen = ({ route }: DiscountOfferScreenProps) => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { isDarkMode } = useContext(ThemeContext);
  const { fromCharacter, character } = route?.params || { fromCharacter: false, character: null };
  
  // Countdown timer (52 minutes)
  const [minutes, setMinutes] = useState(52);
  const [seconds, setSeconds] = useState(0);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const closeButtonOpacity = useState(new Animated.Value(0))[0];

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

    // Show close button after 15 seconds
    const closeButtonTimer = setTimeout(() => {
      setShowCloseButton(true);
      Animated.timing(closeButtonOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 15000);

    return () => {
      clearInterval(timer);
      clearTimeout(closeButtonTimer);
    };
  }, [minutes, seconds, closeButtonOpacity]);

  const handleRedeemOffer = () => {
    if (fromCharacter && character) {
      // Store the character to navigate back to after subscription flow
      navigation.navigate('SubscriptionScreen', { isSpecialOffer: true, returnToCharacter: character });
    } else {
      navigation.navigate('SubscriptionScreen', { isSpecialOffer: true });
    }
  };

  const handleSkip = () => {
    if (fromCharacter && character) {
      // Navigate directly to chat with the character
      navigation.navigate('Chat', { character });
    } else {
      navigation.goBack();
    }
  };

  const backgroundColors = isDarkMode 
    ? ['#0a0d45', '#1a1464', '#261b81'] as const
    : ['#0a0d45', '#1a1464', '#261b81'] as const;

  // Removed "Create your own chatbots" and shortened the descriptions
  const benefits = [
    { icon: 'infinite-outline', text: 'Unlimited answers' },
    { icon: 'people-outline', text: 'Access 1000+ AI Characters' },
    { icon: 'flash-outline', text: 'Powered by latest GPT models' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={backgroundColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.offerTitle}>One-time Offer</Text>
          </View>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {showCloseButton && (
          <Animated.View style={[styles.closeButtonContainer, { opacity: closeButtonOpacity }]}>
            <TouchableOpacity onPress={handleSkip} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={styles.contentContainer}>
          <View style={styles.topSection}>
            <View style={styles.discountBadgeContainer}>
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.discountBadge}
              >
                <View style={styles.discountInner}>
                  <Text style={styles.discountText}>50%</Text>
                  <Text style={styles.discountSubtext}>OFF</Text>
                </View>
              </LinearGradient>
            </View>

            <Text style={styles.featuresTitle}>Limited Time Premium Access</Text>
          </View>
          
          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>Your offer expires in</Text>
            <View style={styles.timerRow}>
              <View style={styles.timerBox}>
                <Text style={styles.timerDigit}>{minutes.toString().padStart(2, '0').charAt(0)}</Text>
              </View>
              <View style={styles.timerBox}>
                <Text style={styles.timerDigit}>{minutes.toString().padStart(2, '0').charAt(1)}</Text>
              </View>
              <Text style={styles.timerSeparator}>:</Text>
              <View style={styles.timerBox}>
                <Text style={styles.timerDigit}>{seconds.toString().padStart(2, '0').charAt(0)}</Text>
              </View>
              <View style={styles.timerBox}>
                <Text style={styles.timerDigit}>{seconds.toString().padStart(2, '0').charAt(1)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.benefitsContainer}>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <LinearGradient
                  colors={['#4CAF50', '#2E7D32']}
                  style={styles.checkCircle}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="checkmark" size={18} color="white" />
                </LinearGradient>
                <Text style={styles.benefitText}>{benefit.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.bottomSection}>
            <TouchableOpacity 
              style={styles.redeemButton} 
              onPress={handleRedeemOffer}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#4CAF50', '#2E7D32']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.redeemGradient}
              >
                <Text style={styles.redeemButtonText}>Redeem Offer</Text>
                <Ionicons name="arrow-forward" size={20} color="white" style={styles.redeemIcon} />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.priceContainer}>
              <Text style={styles.originalPrice}>$49.99</Text>
              <Text style={styles.discountedPrice}>$29.99/year. Cancel anytime</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0d45',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
  },
  topSection: {
    alignItems: 'center',
    width: '100%',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 15,
    paddingBottom: 10,
  },
  headerTextContainer: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-condensed',
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    right: 24,
    zIndex: 10,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadgeContainer: {
    marginTop: Platform.OS === 'ios' ? 10 : 5,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  discountBadge: {
    borderRadius: 60,
    padding: 4,
    transform: [{ rotate: '-5deg' }],
  },
  discountInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  discountText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Black' : 'sans-serif-black',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  discountSubtext: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-condensed',
    letterSpacing: 2,
  },
  featuresTitle: {
    fontSize: 22,
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },
  timerLabel: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    opacity: 0.9,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBox: {
    backgroundColor: 'rgba(55, 91, 210, 0.8)',
    width: 45,
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  timerDigit: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  timerSeparator: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginHorizontal: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  benefitsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    padding: 15,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  benefitText: {
    fontSize: 16,
    color: 'white',
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    fontWeight: '500',
  },
  redeemButton: {
    width: '100%',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 10,
  },
  redeemGradient: {
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redeemButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
    letterSpacing: 0.5,
  },
  redeemIcon: {
    marginLeft: 10,
  },
  priceContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  originalPrice: {
    fontSize: 18,
    color: 'white',
    textDecorationLine: 'line-through',
    opacity: 0.7,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    marginBottom: 2,
  },
  discountedPrice: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
  },
});

export default DiscountOfferScreen; 