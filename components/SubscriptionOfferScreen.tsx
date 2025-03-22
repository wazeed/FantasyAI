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
import { StackNavigationProp } from '@react-navigation/stack';
import { ThemeContext } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const SubscriptionOfferScreen = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { isDarkMode } = useContext(ThemeContext);
  
  // Countdown timer (52 minutes)
  const [minutes, setMinutes] = useState(52);
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

  // Dynamic colors based on theme
  const colors = {
    background: isDarkMode ? '#121212' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#333333',
    subText: isDarkMode ? '#AAAAAA' : '#666666',
    card: isDarkMode ? '#1E1E1E' : '#F5F5F5',
    primary: '#4F46E5',
    secondary: '#8B5CF6',
    accent: '#EC4899',
    success: '#10B981',
  };

  const gradientColors = isDarkMode 
    ? ['#4F46E5', '#8B5CF6', '#EC4899'] 
    : ['#4F46E5', '#8B5CF6', '#EC4899'];

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

        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>Offer expires in:</Text>
          <View style={styles.timerValue}>
            <Text style={styles.timerText}>
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </Text>
          </View>
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Get Premium and unlock:</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="infinite-outline" size={24} color="white" style={styles.featureIcon} />
            <Text style={styles.featureText}>Unlimited answers from AI</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="people-outline" size={24} color="white" style={styles.featureIcon} />
            <Text style={styles.featureText}>Access to all AI characters</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="create-outline" size={24} color="white" style={styles.featureIcon} />
            <Text style={styles.featureText}>Create your own chatbots</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="flash-outline" size={24} color="white" style={styles.featureIcon} />
            <Text style={styles.featureText}>Powered by ChatGPT & GPT-4</Text>
          </View>
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

export default SubscriptionOfferScreen; 