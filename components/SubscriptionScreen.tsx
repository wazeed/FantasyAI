import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemeContext } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

type SubscriptionScreenProps = {
  route?: {
    params?: {
      isSpecialOffer?: boolean;
      returnToCharacter?: any;
    };
  };
};

const SubscriptionScreen = ({ route }: SubscriptionScreenProps) => {
  const navigation = useNavigation<any>();
  const { isDarkMode } = useContext(ThemeContext);
  const { isSpecialOffer, returnToCharacter } = route?.params || { isSpecialOffer: false };
  
  // State
  const [isFreeTrial, setIsFreeTrial] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  
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

  const handleClose = () => {
    if (returnToCharacter) {
      // Navigate to chat with the character
      navigation.navigate('Chat', { character: returnToCharacter });
    } else {
      navigation.goBack();
    }
  };

  const handleRestorePurchase = () => {
    Alert.alert('Restore Purchase', 'Checking for previous purchases...');
    // Implement actual restore logic here
  };

  const handleSubscribe = (planId) => {
    // Here would be code to handle subscription logic
    Alert.alert(
      "Subscription Success",
      "You have successfully subscribed to the premium plan!",
      [
        {
          text: "Continue",
          onPress: () => {
            if (returnToCharacter) {
              // Navigate to chat with the character
              navigation.navigate('Chat', { character: returnToCharacter });
            } else {
              navigation.navigate('MainTabs');
            }
          }
        }
      ]
    );
  };

  const toggleFreeTrial = () => {
    setIsFreeTrial(!isFreeTrial);
  };

  const selectPlan = (plan) => {
    setSelectedPlan(plan);
  };

  // Calculate prices (apply discount if special offer)
  const yearlyPriceOriginal = 49.99;
  const weeklyPriceOriginal = 1.99;
  
  const yearlyPrice = isSpecialOffer ? yearlyPriceOriginal * 0.5 : yearlyPriceOriginal;
  const weeklyPrice = weeklyPriceOriginal;

  return (
    <LinearGradient
      colors={isDarkMode ? ['#121212', '#1E1E1E', '#2D2D2D'] : ['#F9FAFB', '#F3F4F6', '#E5E7EB']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={handleRestorePurchase} style={styles.restoreButton}>
            <Text style={[styles.restoreText, { color: colors.subText }]}>Restore Purchase</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: colors.text }]}>
            Unlock Premium
          </Text>
          <Text style={[styles.subtitle, { color: colors.subText }]}>
            Get unlimited access to all features and AI characters
          </Text>
        </View>

        <View style={styles.featuresSection}>
          <View style={[styles.featureItem, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Ionicons name="chatbubble-outline" size={24} color={colors.primary} style={styles.featureIcon} />
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Unlimited Conversations</Text>
              <Text style={[styles.featureDescription, { color: colors.subText }]}>Chat without restrictions</Text>
            </View>
          </View>
          
          <View style={[styles.featureItem, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Ionicons name="flash-outline" size={24} color={colors.primary} style={styles.featureIcon} />
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Fastest AI Model</Text>
              <Text style={[styles.featureDescription, { color: colors.subText }]}>Get responses in seconds</Text>
            </View>
          </View>
          
          <View style={[styles.featureItem, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Ionicons name="remove-circle-outline" size={24} color={colors.primary} style={styles.featureIcon} />
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Ad-Free Experience</Text>
              <Text style={[styles.featureDescription, { color: colors.subText }]}>No interruptions</Text>
            </View>
          </View>
          
          <View style={[styles.featureItem, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Ionicons name="ribbon-outline" size={24} color={colors.primary} style={styles.featureIcon} />
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Best Value</Text>
              <Text style={[styles.featureDescription, { color: colors.subText }]}>
                {isSpecialOffer ? '50% discount for new users' : 'Save with yearly subscription'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.freeTrialSection}>
          <View style={styles.freeTrialTextContainer}>
            <Text style={[styles.freeTrialTitle, { color: colors.text }]}>7-Day Free Trial</Text>
            <Text style={[styles.freeTrialDescription, { color: colors.subText }]}>
              Try all premium features for free
            </Text>
          </View>
          <Switch
            value={isFreeTrial}
            onValueChange={toggleFreeTrial}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={'#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
          />
        </View>

        <View style={styles.plansSection}>
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === 'yearly' && styles.selectedPlan,
              {
                backgroundColor: isDarkMode ? 
                  (selectedPlan === 'yearly' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(255,255,255,0.05)') : 
                  (selectedPlan === 'yearly' ? 'rgba(79, 70, 229, 0.1)' : 'rgba(0,0,0,0.03)')
              }
            ]}
            onPress={() => selectPlan('yearly')}
          >
            <View style={styles.planHeader}>
              <Text style={[styles.planTitle, { color: colors.text }]}>Yearly</Text>
              {isSpecialOffer && (
                <View style={styles.offerBadge}>
                  <Text style={styles.offerBadgeText}>50% OFF</Text>
                </View>
              )}
            </View>
            
            <View style={styles.priceContainer}>
              {isSpecialOffer && (
                <Text style={[styles.originalPrice, { color: colors.subText }]}>
                  ${yearlyPriceOriginal.toFixed(2)}
                </Text>
              )}
              <Text style={[styles.price, { color: colors.text }]}>
                ${yearlyPrice.toFixed(2)}
              </Text>
              <Text style={[styles.billingCycle, { color: colors.subText }]}>per year</Text>
            </View>
            
            <Text style={[styles.planSaving, { color: colors.primary }]}>
              Save {isSpecialOffer ? '75%' : '50%'} compared to monthly
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === 'weekly' && styles.selectedPlan,
              {
                backgroundColor: isDarkMode ? 
                  (selectedPlan === 'weekly' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(255,255,255,0.05)') : 
                  (selectedPlan === 'weekly' ? 'rgba(79, 70, 229, 0.1)' : 'rgba(0,0,0,0.03)')
              }
            ]}
            onPress={() => selectPlan('weekly')}
          >
            <Text style={[styles.planTitle, { color: colors.text }]}>Weekly</Text>
            
            <View style={styles.priceContainer}>
              <Text style={[styles.price, { color: colors.text }]}>
                ${weeklyPrice.toFixed(2)}
              </Text>
              <Text style={[styles.billingCycle, { color: colors.subText }]}>per week</Text>
            </View>
            
            <Text style={[styles.planSaving, { color: colors.subText }]}>
              Flexible short-term option
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={() => handleSubscribe(selectedPlan)}>
          <Text style={styles.continueButtonText}>
            {isFreeTrial ? 'Start Free Trial' : 'Continue'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.termsText, { color: colors.subText }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy. Subscriptions automatically renew until canceled.
        </Text>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  closeButton: {
    padding: 4,
  },
  restoreButton: {
    padding: 8,
  },
  restoreText: {
    fontSize: 16,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  featuresSection: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  featureIcon: {
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
  },
  freeTrialSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  freeTrialTextContainer: {
    flex: 1,
  },
  freeTrialTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  freeTrialDescription: {
    fontSize: 14,
  },
  plansSection: {
    marginBottom: 24,
  },
  planCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  selectedPlan: {
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  offerBadge: {
    backgroundColor: '#EC4899',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  offerBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 18,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 4,
  },
  billingCycle: {
    fontSize: 16,
  },
  planSaving: {
    fontSize: 14,
  },
  continueButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
  },
});

export default SubscriptionScreen; 