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
      console.log('15 seconds passed, showing close button');
      setShowCloseButton(true);
      Animated.timing(closeButtonOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 15000);

    // For testing - show close button after 5 seconds in development
    if (__DEV__) {
      console.log('Development mode: Close button will appear in 5 seconds');
      // Clear the 15s timer if the 5s one is active
      clearTimeout(closeButtonTimer);
      setTimeout(() => {
        console.log('DEV: Showing close button');
        setShowCloseButton(true);
        Animated.timing(closeButtonOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 5000);
    }

    return () => {
      clearInterval(timer);
      clearTimeout(closeButtonTimer);
    };
  }, [minutes, seconds]); // Removed closeButtonOpacity from dependencies

  const handleRedeemOffer = () => {
    if (fromCharacter && character) {
      // Store the character to navigate back to after subscription flow
      navigation.navigate('SubscriptionScreen', { isSpecialOffer: true, returnToCharacter: character });
    } else {
      navigation.navigate('SubscriptionScreen', { isSpecialOffer: true });
    }
  };

  const handleClose = () => {
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

  // Text colors based on theme
  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const secondaryTextColor = isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.7)';
  
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
            <Text style={[styles.offerTitle, { color: textColor }]}>One-time Offer</Text>
          </View>
        </View>

        {showCloseButton && (
          <Animated.View style={[styles.closeButtonContainer, { opacity: closeButtonOpacity }]}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={26} color="white" />
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
                  <Text style={[styles.discountText, { color: textColor }]}>50%</Text>
                  <Text style={[styles.discountSubtext, { color: textColor }]}>OFF</Text>
                </View>
              </LinearGradient>
            </View>

            <Text style={[styles.featuresTitle, { color: textColor }]}>Limited Time Premium Access</Text>
          </View>
          
          <View style={styles.timerContainer}>
            <Text style={[styles.timerLabel, { color: secondaryTextColor }]}>Your offer expires in</Text>
            <View style={styles.timerRow}>
              <View style={styles.timerBox}>
                <Text style={[styles.timerDigit, { color: textColor }]}>{minutes.toString().padStart(2, '0').charAt(0)}</Text>
              </View>
              <View style={styles.timerBox}>
                <Text style={[styles.timerDigit, { color: textColor }]}>{minutes.toString().padStart(2, '0').charAt(1)}</Text>
              </View>
              <Text style={[styles.timerSeparator, { color: textColor }]}>:</Text>
              <View style={styles.timerBox}>
                <Text style={[styles.timerDigit, { color: textColor }]}>{seconds.toString().padStart(2, '0').charAt(0)}</Text>
              </View>
              <View style={styles.timerBox}>
                <Text style={[styles.timerDigit, { color: textColor }]}>{seconds.toString().padStart(2, '0').charAt(1)}</Text>
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
                <Text style={[styles.benefitText, { color: textColor }]}>{benefit.text}</Text>
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
                <Text style={[styles.redeemButtonText, { color: textColor }]}>Redeem Offer</Text>
                <Ionicons name="arrow-forward" size={20} color={textColor} style={styles.redeemIcon} />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.priceContainer}>
              <Text style={[styles.originalPrice, { color: secondaryTextColor }]}>$49.99</Text>
              <Text style={[styles.discountedPrice, { color: textColor }]}>$29.99/year. Cancel anytime</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 15,
    paddingBottom: 10,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  offerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-condensed',
    textAlign: 'center',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    right: 20,
    zIndex: 100,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
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
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Black' : 'sans-serif-black',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  discountSubtext: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-condensed',
    letterSpacing: 2,
  },
  featuresTitle: {
    fontSize: 22,
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
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
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
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  timerSeparator: {
    fontSize: 36,
    fontWeight: 'bold',
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
    textDecorationLine: 'line-through',
    opacity: 0.7,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    marginBottom: 2,
  },
  discountedPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
  },
});

export default DiscountOfferScreen; 