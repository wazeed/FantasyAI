import React, { useState, useEffect } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
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
import { presentPaywall } from '../services/superwallService';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// --- Types ---
type PlanId = 'yearly' | 'weekly';

// Placeholder for navigation types - should be defined centrally
type RootStackParamList = {
  Chat: { character: any }; // Use a more specific type for character if available
  MainTabs: undefined; // Assuming a tab navigator exists
  SubscriptionScreen: { isSpecialOffer?: boolean; returnToCharacter?: any };
  [key: string]: any; // Allow other routes
};

type SubscriptionScreenRouteProp = RouteProp<RootStackParamList, 'SubscriptionScreen'>;

interface SubscriptionScreenProps {
  route: SubscriptionScreenRouteProp;
  // navigation prop is automatically typed by useNavigation hook below
}

interface Feature {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

// --- Constants ---
const YEARLY_PLAN_ID: PlanId = 'yearly';
const WEEKLY_PLAN_ID: PlanId = 'weekly';
const YEARLY_PRICE_ORIGINAL = 49.99;
const WEEKLY_PRICE_ORIGINAL = 1.99;
const FEATURES_DATA: Feature[] = [
  { icon: "chatbubble-outline", title: "Unlimited Conversations", description: "Chat without restrictions" },
  { icon: "flash-outline", title: "Fastest AI Model", description: "Get responses in seconds" },
  { icon: "remove-circle-outline", title: "Ad-Free Experience", description: "No interruptions" },
  { icon: "ribbon-outline", title: "Best Value", description: "Save with yearly subscription" }, // Description updated dynamically below
];
const TERMS_TEXT = "By continuing, you agree to our Terms of Service and Privacy Policy. Subscriptions automatically renew until canceled.";

// --- Main Component ---
const SubscriptionScreenComponent: React.FC<SubscriptionScreenProps> = ({ route }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, styles: themeStyles, isDarkMode } = useTheme();
  const { isSubscribed, isLoading, error } = useSubscription();

  // Only present paywall on mount if not already subscribed
  useEffect(() => {
    if (isSubscribed === false) {
      presentPaywall('default_paywall');
    }
    // Do not call if loading or already subscribed
  }, [isSubscribed]);
  
  const { isSpecialOffer = false, returnToCharacter } = route.params ?? {};
  
  // State
  const [isFreeTrial, setIsFreeTrial] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(YEARLY_PLAN_ID);
  
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

  const handleSubscribe = (planId: PlanId) => {
    // Trigger Superwall paywall
    presentPaywall('default_paywall');
  };

  const toggleFreeTrial = () => {
    setIsFreeTrial(!isFreeTrial);
  };

  const selectPlan = (plan: PlanId) => {
    setSelectedPlan(plan);
  };

  // Calculate prices (apply discount if special offer)
  const yearlyPriceOriginal = YEARLY_PRICE_ORIGINAL;
  const weeklyPriceOriginal = WEEKLY_PRICE_ORIGINAL;
  
  const yearlyPrice = isSpecialOffer ? yearlyPriceOriginal * 0.5 : yearlyPriceOriginal;
  const weeklyPrice = weeklyPriceOriginal;

  // UI: loading, error, already subscribed, or show paywall
  if (isLoading) {
    return (
      <View style={[themeStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text, fontSize: 18 }}>Checking subscription status...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[themeStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.error, fontSize: 16, marginBottom: 12 }}>Error: {error}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={themeStyles.primaryButton}>
          <Text style={themeStyles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isSubscribed) {
    // Already subscribed: show confirmation and hide paywall
    return (
      <View style={[themeStyles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <Ionicons name="checkmark-circle-outline" size={64} color={colors.primary} style={{ marginBottom: 16 }} />
        <Text style={[themeStyles.headerText, { marginBottom: 8, textAlign: 'center' }]}>
          You're a Premium Member!
        </Text>
        <Text style={[themeStyles.subheadingText, { textAlign: 'center', marginBottom: 24 }]}>
          Thank you for subscribing. Enjoy unlimited access to all features and AI characters.
        </Text>
        <TouchableOpacity onPress={handleClose} style={themeStyles.primaryButton}>
          <Text style={themeStyles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Not subscribed: show paywall
  return (
    <LinearGradient
      colors={[colors.background, colors.background, colors.background]}
      style={themeStyles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={handleRestorePurchase} style={styles.restoreButton}>
            <Text style={[styles.restoreText, { color: colors.primary }]}>Restore Purchase</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.titleSection}>
          <Text style={[themeStyles.headerText, { marginBottom: 8 }]}>
            Unlock Premium
          </Text>
          <Text style={themeStyles.subheadingText}>
            Get unlimited access to all features and AI characters
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresSection}>
          {FEATURES_DATA.map((feature, index) => (
            <FeatureItem
              key={index}
              icon={feature.icon}
              title={feature.title}
              // Dynamically update description for the "Best Value" feature based on offer
              description={feature.title === "Best Value"
                ? (isSpecialOffer ? '50% discount for new users' : feature.description)
                : feature.description}
              themeStyles={themeStyles}
              colors={colors}
            />
          ))}
        </View>
        
        {/* Free Trial Toggle */}
        <FreeTrialToggle
          isFreeTrial={isFreeTrial}
          toggleFreeTrial={toggleFreeTrial}
          themeStyles={themeStyles}
          colors={colors}
        />

        <View style={styles.plansSection}>
          {/* Yearly Plan Card */}
          <PlanCard
            planId={YEARLY_PLAN_ID}
            title="Yearly"
            originalPrice={isSpecialOffer ? yearlyPriceOriginal : undefined}
            price={yearlyPrice}
            billingCycle="per year"
            savingText={`Save ${isSpecialOffer ? '75%' : '50%'} compared to weekly`} // Adjusted saving text
            isSelected={selectedPlan === YEARLY_PLAN_ID}
            isSpecialOffer={isSpecialOffer}
            onSelect={selectPlan}
            themeStyles={themeStyles}
            colors={colors}
          />

          {/* Weekly Plan Card */}
          <PlanCard
            planId={WEEKLY_PLAN_ID}
            title="Weekly"
            price={weeklyPrice}
            billingCycle="per week"
            savingText="Flexible short-term option"
            isSelected={selectedPlan === WEEKLY_PLAN_ID}
            onSelect={selectPlan}
            themeStyles={themeStyles}
            colors={colors}
          />
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={themeStyles.primaryButton}
          onPress={() => handleSubscribe(selectedPlan)}
          activeOpacity={0.8}
        >
          <Text style={themeStyles.primaryButtonText}>
            {isFreeTrial ? 'Start Free Trial' : 'Continue'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.termsText, { color: colors.secondaryText }]}>
          {TERMS_TEXT}
        </Text>
      </ScrollView>
    </LinearGradient>
  );
};

// --- Subcomponents ---

interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  themeStyles: any;
  colors: any;
}

const FeatureItem: React.FC<FeatureItemProps> = React.memo(({ icon, title, description, themeStyles, colors }) => (
  <View style={[styles.featureItem, { backgroundColor: colors.cardBg }]}>
    <Ionicons name={icon} size={24} color={colors.primary} style={styles.featureIcon} />
    <View style={styles.featureTextContainer}>
      <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.featureDescription, { color: colors.secondaryText }]}>{description}</Text>
    </View>
  </View>
));

interface FreeTrialToggleProps {
  isFreeTrial: boolean;
  toggleFreeTrial: () => void;
  themeStyles: any;
  colors: any;
}

const FreeTrialToggle: React.FC<FreeTrialToggleProps> = React.memo(({ isFreeTrial, toggleFreeTrial, themeStyles, colors }) => (
  <View style={[styles.freeTrialSection, { backgroundColor: colors.tileBg }]}>
    <View style={styles.freeTrialTextContainer}>
      <Text style={[styles.freeTrialTitle, { color: colors.text }]}>7-Day Free Trial</Text>
      <Text style={[styles.freeTrialDescription, { color: colors.secondaryText }]}>
        Try all premium features for free
      </Text>
    </View>
    <Switch
      value={isFreeTrial}
      onValueChange={toggleFreeTrial}
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor={isFreeTrial ? "#FFFFFF" : "#D1D5DB"}
      ios_backgroundColor={colors.border}
    />
  </View>
));

interface PlanCardProps {
  planId: PlanId;
  title: string;
  originalPrice?: number;
  price: number;
  billingCycle: string;
  savingText: string;
  isSelected: boolean;
  isSpecialOffer?: boolean;
  onSelect: (planId: PlanId) => void;
  themeStyles: any;
  colors: any;
}

const PlanCard: React.FC<PlanCardProps> = React.memo(({
  planId, title, originalPrice, price, billingCycle, savingText, isSelected, isSpecialOffer, onSelect, themeStyles, colors
}) => (
  <TouchableOpacity
    style={[
      styles.planCard,
      isSelected && [styles.selectedPlan, { borderColor: colors.primary }],
      { backgroundColor: isSelected ? colors.tileBg : colors.cardBg }
    ]}
    onPress={() => onSelect(planId)}
    activeOpacity={0.7}
  >
    <View style={styles.planHeader}>
      <Text style={[styles.planTitle, { color: colors.text }]}>{title}</Text>
      {isSpecialOffer && planId === YEARLY_PLAN_ID && (
        <View style={[styles.offerBadge, { backgroundColor: colors.accent }]}>
          <Text style={[styles.offerBadgeText, { color: '#FFFFFF' }]}>50% OFF</Text>
        </View>
      )}
    </View>
    
    <View style={styles.priceContainer}>
      {originalPrice && (
        <Text style={[styles.originalPrice, { color: colors.secondaryText }]}>
          ${originalPrice.toFixed(2)}
        </Text>
      )}
      <Text style={[styles.price, { color: colors.text }]}>
        ${price.toFixed(2)}
      </Text>
      <Text style={[styles.billingCycle, { color: colors.secondaryText }]}>{billingCycle}</Text>
    </View>
    
    <Text style={[styles.planSaving, { color: planId === YEARLY_PLAN_ID ? colors.primary : colors.secondaryText }]}>
      {savingText}
    </Text>
  </TouchableOpacity>
));

// --- Styles ---
const styles = StyleSheet.create({
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  offerBadgeText: {
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
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
  },
});

// --- Exports ---
export { SubscriptionScreenComponent as SubscriptionScreen }; // Named export
export default SubscriptionScreenComponent; // Default export