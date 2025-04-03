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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ThemeContext } from '../contexts/ThemeContext';
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
// Removed old type definition

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

// --- Theme Helper ---
const getThemeColors = (isDarkMode: boolean) => ({
  backgroundGradient: isDarkMode ? ['#121212', '#1E1E1E', '#2D2D2D'] as const : ['#F9FAFB', '#F3F4F6', '#E5E7EB'] as const,
  text: isDarkMode ? '#FFFFFF' : '#333333',
  subText: isDarkMode ? '#AAAAAA' : '#666666',
  cardBgSelected: isDarkMode ? 'rgba(79, 70, 229, 0.2)' : 'rgba(79, 70, 229, 0.1)',
  cardBgDefault: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
  primary: '#4F46E5', // Used for borders, savings text, switch track
  accent: '#EC4899', // Used for offer badge
  featureIcon: '#4F46E5', // Primary color for feature icons
  switchThumb: '#f4f3f4',
  switchTrackFalse: '#767577',
  switchTrackTrueIos: '#3e3e3e',
  continueButtonBg: '#4F46E5',
  continueButtonText: '#FFFFFF',
  offerBadgeText: '#FFFFFF',
  selectedPlanBorder: '#4F46E5',
});

// --- Main Component ---

const SubscriptionScreenComponent: React.FC<SubscriptionScreenProps> = ({ route }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDarkMode } = useContext(ThemeContext);
  const { isSpecialOffer = false, returnToCharacter } = route.params ?? {};
  
  // State
  const [isFreeTrial, setIsFreeTrial] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(YEARLY_PLAN_ID);
  
  // Dynamic colors based on theme using helper
  const colors = React.useMemo(() => getThemeColors(isDarkMode), [isDarkMode]);

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

  const selectPlan = (plan: PlanId) => {
    setSelectedPlan(plan);
  };

  // Calculate prices (apply discount if special offer)
  const yearlyPriceOriginal = YEARLY_PRICE_ORIGINAL;
  const weeklyPriceOriginal = WEEKLY_PRICE_ORIGINAL;
  
  const yearlyPrice = isSpecialOffer ? yearlyPriceOriginal * 0.5 : yearlyPriceOriginal;
  const weeklyPrice = weeklyPriceOriginal;

  return (
    <LinearGradient
      colors={isDarkMode ? ['#121212', '#1E1E1E', '#2D2D2D'] : ['#F9FAFB', '#F3F4F6', '#E5E7EB']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          {/* Placeholder for potential back button if needed */}
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={handleRestorePurchase} style={styles.restoreButton}>
            <Text style={[styles.restoreText, { color: colors.primary }]}>Restore Purchase</Text>
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
              colors={colors}
            />
          ))}
        </View>
        
        {/* Free Trial Toggle */}
        <FreeTrialToggle
          isFreeTrial={isFreeTrial}
          toggleFreeTrial={toggleFreeTrial}
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
            colors={colors}
          />
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.continueButtonBg }]}
          onPress={() => handleSubscribe(selectedPlan)}
          activeOpacity={0.8}
        >
          <Text style={[styles.continueButtonText, { color: colors.continueButtonText }]}>
            {isFreeTrial ? 'Start Free Trial' : 'Continue'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.termsText, { color: colors.subText }]}>
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
  colors: ReturnType<typeof getThemeColors>;
}

const FeatureItem: React.FC<FeatureItemProps> = React.memo(({ icon, title, description, colors }) => (
  <View style={[styles.featureItem, { backgroundColor: colors.cardBgDefault }]}>
    <Ionicons name={icon} size={24} color={colors.featureIcon} style={styles.featureIcon} />
    <View style={styles.featureTextContainer}>
      <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.featureDescription, { color: colors.subText }]}>{description}</Text>
    </View>
  </View>
));

interface FreeTrialToggleProps {
  isFreeTrial: boolean;
  toggleFreeTrial: () => void;
  colors: ReturnType<typeof getThemeColors>;
}

const FreeTrialToggle: React.FC<FreeTrialToggleProps> = React.memo(({ isFreeTrial, toggleFreeTrial, colors }) => (
  <View style={[styles.freeTrialSection, { backgroundColor: colors.cardBgSelected }]}>
    <View style={styles.freeTrialTextContainer}>
      <Text style={[styles.freeTrialTitle, { color: colors.text }]}>7-Day Free Trial</Text>
      <Text style={[styles.freeTrialDescription, { color: colors.subText }]}>
        Try all premium features for free
      </Text>
    </View>
    <Switch
      value={isFreeTrial}
      onValueChange={toggleFreeTrial}
      trackColor={{ false: colors.switchTrackFalse, true: colors.primary }}
      thumbColor={colors.switchThumb}
      ios_backgroundColor={colors.switchTrackTrueIos}
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
  colors: ReturnType<typeof getThemeColors>;
}

const PlanCard: React.FC<PlanCardProps> = React.memo(({
  planId, title, originalPrice, price, billingCycle, savingText, isSelected, isSpecialOffer, onSelect, colors
}) => (
  <TouchableOpacity
    style={[
      styles.planCard,
      isSelected && [styles.selectedPlan, { borderColor: colors.selectedPlanBorder }],
      { backgroundColor: isSelected ? colors.cardBgSelected : colors.cardBgDefault }
    ]}
    onPress={() => onSelect(planId)}
    activeOpacity={0.7}
  >
    <View style={styles.planHeader}>
      <Text style={[styles.planTitle, { color: colors.text }]}>{title}</Text>
      {isSpecialOffer && planId === YEARLY_PLAN_ID && ( // Show badge only for yearly special offer
        <View style={[styles.offerBadge, { backgroundColor: colors.accent }]}>
          <Text style={[styles.offerBadgeText, { color: colors.offerBadgeText }]}>50% OFF</Text>
        </View>
      )}
    </View>
    
    <View style={styles.priceContainer}>
      {originalPrice && (
        <Text style={[styles.originalPrice, { color: colors.subText }]}>
          ${originalPrice.toFixed(2)}
        </Text>
      )}
      <Text style={[styles.price, { color: colors.text }]}>
        ${price.toFixed(2)}
      </Text>
      <Text style={[styles.billingCycle, { color: colors.subText }]}>{billingCycle}</Text>
    </View>
    
    <Text style={[styles.planSaving, { color: planId === YEARLY_PLAN_ID ? colors.primary : colors.subText }]}>
      {savingText}
    </Text>
  </TouchableOpacity>
));

// --- Styles ---
// Styles remain largely the same

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

// --- Exports ---
export { SubscriptionScreenComponent as SubscriptionScreen }; // Named export
export default SubscriptionScreenComponent; // Default export