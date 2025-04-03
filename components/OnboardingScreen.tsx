import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  SafeAreaView,
  useWindowDimensions,
  FlatList,
  Animated,
  Easing,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useOnboarding } from '../contexts/OnboardingContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; // Import navigation type

// Placeholder for navigation types - should be defined centrally
type RootStackParamList = {
  [key: string]: any; // Allow other routes
};

// --- Constants ---
const MIN_INTERESTS = 3;
const FREE_CREDITS_AMOUNT = 30;
const ANIMATION_DURATION_SHORT = 250;
const ANIMATION_DURATION_MEDIUM = 500;
const ANIMATION_DURATION_LONG = 1500;
const GIFT_ANIMATION_DURATION = 1000;

// --- Types ---
interface InterestCategory {
  id: number;
  title: string;
  icon: keyof typeof Ionicons.glyphMap; // Use keyof for type safety
}

// --- Static Data (moved outside component) ---
const interestCategories: InterestCategory[] = [
  { id: 1, title: 'Roleplaying', icon: 'game-controller-outline' },
  { id: 2, title: 'Adventure', icon: 'compass-outline' },
  { id: 3, title: 'Anime', icon: 'apps-outline' },
  { id: 4, title: 'Fantasy', icon: 'planet-outline' },
  { id: 5, title: 'History', icon: 'book-outline' },
  { id: 6, title: 'LGBTQ', icon: 'heart-outline' },
  { id: 7, title: 'Mystery', icon: 'search-outline' },
  { id: 8, title: 'Paranormal', icon: 'flash-outline' },
  { id: 9, title: 'Religion', icon: 'prism-outline' },
  { id: 10, title: 'Romance', icon: 'rose-outline' },
  { id: 11, title: 'Sci-Fi', icon: 'rocket-outline' },
];

const lifestyleCategories: InterestCategory[] = [
  { id: 12, title: 'Friendship', icon: 'people-outline' },
  { id: 13, title: 'Emotional Wellness', icon: 'pulse-outline' },
];

// --- Theme Helper ---
const getThemeColors = (isDarkMode: boolean) => ({
  backgroundGradient: isDarkMode
    ? ['#121212', '#1A1A1A', '#222222'] as const
    : ['#FFFFFF', '#F8FAFF', '#F0F4FF'] as const,
  cardGradient: isDarkMode
    ? ['#1E1E1E', '#252525'] as const
    : ['#F8F8F8', '#FFFFFF'] as const,
  text: isDarkMode ? '#FFFFFF' : '#000000',
  subtitle: isDarkMode ? '#BBBBBB' : '#666666',
  interestItemBg: isDarkMode ? '#1E1E1E' : '#F8F8F8',
  interestItemBorder: isDarkMode ? '#333333' : '#EEEEEE',
  interestIconBg: isDarkMode ? ['#2A2A2A', '#333333'] as const : ['#F0F0F0', '#FAFAFA'] as const,
  interestIconColor: isDarkMode ? '#FFFFFF' : '#555555',
  selectedInterestBorder: '#0070F3',
  selectedInterestText: '#0070F3',
  selectedIconBg: ['#0070F3', '#0063DA'] as const,
  selectedIconColor: '#FFFFFF',
  buttonGradient: ['#0070F3', '#0063DA'] as const,
  buttonText: '#FFFFFF',
  disabledButtonOpacity: 0.5,
  guestButtonBorder: isDarkMode ? '#444444' : '#DDDDDD',
  guestButtonBg: isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(255, 255, 255, 0.7)',
  guestButtonText: isDarkMode ? '#BBBBBB' : '#555555',
  starColor: '#FFD700',
  starOutlineColor: isDarkMode ? '#FFFFFF' : '#000000',
  creditBadgeBg: ['#162B47', '#1D3759'] as const,
  creditCounterBg: isDarkMode ? ['#1A1D21', '#252A33'] as const : ['#F0F4FF', '#E6EDFF'] as const,
  creditFeaturesBg: isDarkMode ? ['rgba(30, 30, 30, 0.7)', 'rgba(35, 35, 35, 0.7)'] as const : ['rgba(248, 250, 252, 0.8)', 'rgba(240, 245, 255, 0.8)'] as const,
  checkmarkColor: '#4CAF50',
  completionCircleBg: '#4CAF50',
});

// --- Main Component ---

const OnboardingScreenComponent: React.FC = () => {

// Removed duplicate declaration
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState<number[]>([]);
  const [rating, setRating] = useState(0);
  const { width, height } = useWindowDimensions();
  const { completeOnboarding, resetOnboarding } = useOnboarding();
  const { isDarkMode } = React.useContext(ThemeContext);
  const { skipAuth } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const giftAnim = useRef(new Animated.Value(0)).current;
  const creditCountAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(width)).current;
  const [creditCount, setCreditCount] = useState(0);

  useEffect(() => {
    // Reset animation values
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);
    slideAnim.setValue(width);
    
    // Animate in the current screen with combined animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION_MEDIUM,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION_MEDIUM + 50, // Slightly longer for effect
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION_MEDIUM,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start();

    // For credits screen, animate the counter
    if (currentStep === 2) {
      Animated.timing(creditCountAnim, {
        toValue: 30,
        duration: ANIMATION_DURATION_LONG,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    }

    // For gift screen, animate the gift
    if (currentStep === 1) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(giftAnim, {
            toValue: 1,
            duration: GIFT_ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(giftAnim, {
            toValue: 0,
            duration: GIFT_ANIMATION_DURATION,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [currentStep]);

  // Update credit count for animation
  useEffect(() => {
    creditCountAnim.addListener(({ value }) => {
      setCreditCount(Math.floor(value));
    });
    
    return () => {
      creditCountAnim.removeAllListeners();
    };
  }, []);

  // Toggle an interest selection
  const toggleInterest = (id: number) => {
    setSelectedInterests(prevSelected => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter(item => item !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };

  // Check if at least 3 interests are selected
  const canProceedFromInterests = selectedInterests.length >= MIN_INTERESTS;

  // Next step handler
  const handleNext = () => {
    if (currentStep < 4) {
      // Animate current screen out before changing step
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION_SHORT,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: ANIMATION_DURATION_SHORT,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(currentStep + 1);
      });
    } else {
      completeOnboarding();
    }
  };

  // Back step handler
  const handleBack = () => {
    if (currentStep > 0) {
      // Animate current screen out before changing step
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION_SHORT,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: ANIMATION_DURATION_SHORT,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(currentStep - 1);
      });
    }
  };

  // Skip to completion as guest
  const handleContinueAsGuest = () => {
    skipAuth();
    completeOnboarding();
  };

  // For development: reset onboarding on each app launch
  useEffect(() => {
    // Uncomment the line below to reset onboarding every time the component mounts
    // if (__DEV__) { resetOnboarding(); } // Optionally reset only in dev
  }, []);

  // Theme colors derived using helper
  const colors = React.useMemo(() => getThemeColors(isDarkMode), [isDarkMode]);

  // --- Render Logic ---

  const renderCurrentStep = () => { // Renamed for clarity
    const stepProps = {
      isDarkMode,
      colors,
      fadeAnim,
      scaleAnim,
      slideAnim,
      handleNext,
    };

    switch (currentStep) {
      case 0:
        return (
          <InterestsStep
            {...stepProps}
            selectedInterests={selectedInterests}
            toggleInterest={toggleInterest}
            canProceed={canProceedFromInterests}
          />
        );
      case 1:
        return (
          <WelcomeGiftStep
            {...stepProps}
            giftAnim={giftAnim}
          />
        );
      case 2:
        return (
          <FreeCreditsStep
            {...stepProps}
            creditCount={creditCount}
          />
        );
      case 3:
        return (
          <RatingStep
            {...stepProps}
            rating={rating}
            setRating={setRating}
          />
        );
      case 4:
        return (
          <CompletionStep
            {...stepProps}
            completeOnboarding={completeOnboarding}
            handleContinueAsGuest={handleContinueAsGuest}
          />
        );
      default:
        // Fallback to the first step
        return (
          <InterestsStep
            {...stepProps}
            selectedInterests={selectedInterests}
            toggleInterest={toggleInterest}
            canProceed={canProceedFromInterests}
          />
        );
    }
  };

  return renderCurrentStep(); // Explicitly return the rendered step
} // <-- Closing brace for OnboardingScreenComponent
// Removed duplicated renderStep logic outside the component

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 10 : 15,
    paddingBottom: 10,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  headingContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 10,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingTop: 10,
  },
  scrollContainer: {
    flex: 1, 
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  categoriesContainer: {
    marginTop: 10,
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: 16,
    letterSpacing: -0.5,
  },
  darkText: {
    color: '#FFFFFF',
  },
  lightText: {
    color: '#000000',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 26,
    paddingHorizontal: 10,
  },
  darkSubtitle: {
    color: '#BBBBBB',
  },
  lightSubtitle: {
    color: '#666666',
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 18,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  interestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    borderRadius: 16,
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  darkInterestItem: {
    backgroundColor: '#1E1E1E',
    borderColor: '#333333',
  },
  lightInterestItem: {
    backgroundColor: '#F8F8F8',
    borderColor: '#EEEEEE',
  },
  selectedInterest: {
    borderColor: '#0070F3',
    borderWidth: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedIconContainer: {
    backgroundColor: '#0070F3',
  },
  interestText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  selectedInterestText: {
    fontWeight: '600',
    color: '#0070F3',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  bottomContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 16,
    paddingTop: 12,
  },
  selectionCount: {
    fontSize: 16,
    marginBottom: 14,
    fontWeight: '500',
  },
  nextButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    marginTop: 12,
    shadowColor: '#0070F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    overflow: 'hidden',
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  giftContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  giftDescription: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 26,
  },
  giftBox: {
    width: 200,
    height: 200,
    marginBottom: 40,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftBoxTop: {
    width: 150,
    height: 55,
    backgroundColor: '#FF4A85',
    position: 'absolute',
    top: 40,
    borderRadius: 12,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  giftBoxRibbon: {
    width: 30,
    height: 150,
    backgroundColor: '#FF4A85',
    position: 'absolute',
    left: 60,
    top: -40,
    zIndex: 3,
    borderRadius: 10,
  },
  giftBoxBottom: {
    width: 150,
    height: 130,
    backgroundColor: '#FF6E9E',
    position: 'absolute',
    top: 95,
    borderRadius: 12,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  giftGlow: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FF6E9E',
    position: 'absolute',
    opacity: 0.3,
    zIndex: 0,
  },
  creditBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  creditCounter: {
    alignItems: 'center',
    marginVertical: 16,
    width: '100%',
  },
  creditCounterBg: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  creditCountText: {
    fontSize: 72,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  creditLabel: {
    fontSize: 20,
    marginTop: 6,
    fontWeight: '600',
  },
  creditFeatures: {
    width: '100%',
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  creditFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  creditFeatureText: {
    fontSize: 17,
    marginLeft: 14,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    marginVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '100%',
  },
  starButton: {
    padding: 7,
  },
  starIcon: {
    marginHorizontal: 7,
  },
  completionCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  guestButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  darkGuestButton: {
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    borderColor: '#444444',
  },
  lightGuestButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderColor: '#DDDDDD',
  },
  guestButtonText: {
    fontSize: 17,
    fontWeight: '500',
  },
  darkGuestText: {
    color: '#BBBBBB',
  },
  lightGuestText: {
    color: '#555555',
  },
  buttonContainer: {
    width: '100%',
    paddingVertical: 10,
    marginTop: 'auto',
  },
});

// --- Step Components ---

interface StepProps {
  isDarkMode: boolean;
  colors: ReturnType<typeof getThemeColors>;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  slideAnim: Animated.Value;
  handleNext: () => void;
}

interface InterestsStepProps extends StepProps {
  selectedInterests: number[];
  toggleInterest: (id: number) => void;
  canProceed: boolean;
}

const InterestsStep: React.FC<InterestsStepProps> = React.memo(({
  isDarkMode, colors, fadeAnim, scaleAnim, slideAnim, handleNext, selectedInterests, toggleInterest, canProceed
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <LinearGradient colors={colors.backgroundGradient} style={styles.gradientBackground}>
        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateX: slideAnim }] }]}>
          <View style={styles.headingContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Who Will You Chat With?</Text>
            <Text style={[styles.subtitle, { color: colors.subtitle }]}>Select {MIN_INTERESTS}+ interests to discover AI characters you'll love.</Text>
          </View>
          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.categoriesContainer}>
              <Text style={[styles.categoryTitle, { color: colors.text }]}>Character Types & Genres</Text>
              <View style={styles.interestsGrid}>
                {interestCategories.map((item) => (
                  <InterestItem key={item.id} item={item} selected={selectedInterests.includes(item.id)} onPress={toggleInterest} colors={colors} />
                ))}
              </View>
              <Text style={[styles.categoryTitle, { color: colors.text, marginTop: 30 }]}>Conversation Styles</Text>
              <View style={styles.interestsGrid}>
                {lifestyleCategories.map((item) => (
                  <InterestItem key={item.id} item={item} selected={selectedInterests.includes(item.id)} onPress={toggleInterest} colors={colors} />
                ))}
              </View>
            </View>
          </ScrollView>
        </Animated.View>
        <View style={styles.bottomContainer}>
          <Text style={[styles.selectionCount, { color: colors.subtitle }]}>{selectedInterests.length} of {MIN_INTERESTS} minimum selected</Text>
          <NextButton title="Continue" onPress={handleNext} disabled={!canProceed} colors={colors} icon="arrow-forward" />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
});

interface WelcomeGiftStepProps extends StepProps {
  giftAnim: Animated.Value;
}

const WelcomeGiftStep: React.FC<WelcomeGiftStepProps> = React.memo(({
  isDarkMode, colors, fadeAnim, scaleAnim, slideAnim, handleNext, giftAnim
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <LinearGradient colors={colors.backgroundGradient} style={styles.gradientBackground}>
        <Animated.View style={[styles.giftContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateX: slideAnim }] }]}>
          <Text style={[styles.title, { color: colors.text }]}>Unlock Your First Conversations!</Text>
          <Text style={[styles.giftDescription, { color: colors.subtitle }]}>Claim your welcome gift: free credits to start chatting with any AI character instantly!</Text>
          <Animated.View style={[styles.giftBox, { transform: [{ translateY: giftAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) }] }]}>
            <View style={styles.giftBoxTop}><View style={styles.giftBoxRibbon} /></View>
            <View style={styles.giftBoxBottom} />
            <Animated.View style={[styles.giftGlow, { opacity: giftAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] }) }]} />
          </Animated.View>
          <NextButton title="Continue" onPress={handleNext} colors={colors} icon="arrow-forward" />
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
});

interface FreeCreditsStepProps extends StepProps {
  creditCount: number;
}

const FreeCreditsStep: React.FC<FreeCreditsStepProps> = React.memo(({
  isDarkMode, colors, fadeAnim, scaleAnim, slideAnim, handleNext, creditCount
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <LinearGradient colors={colors.backgroundGradient} style={styles.gradientBackground}>
        <Animated.View style={[styles.giftContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateX: slideAnim }] }]}>
          <LinearGradient colors={colors.creditBadgeBg} style={styles.creditBadge}>
            <Ionicons name="star" size={32} color={colors.starColor} />
          </LinearGradient>
          <Text style={[styles.title, { color: colors.text }]}>Your Free Credits Are Here!</Text>
          <Text style={[styles.giftDescription, { color: colors.subtitle }]}>Use your {FREE_CREDITS_AMOUNT} credits to dive into conversations across history, fantasy, and more.</Text>
          <View style={styles.creditCounter}>
            <LinearGradient colors={colors.creditCounterBg} style={styles.creditCounterBg}>
              <Animated.Text style={[styles.creditCountText, { color: colors.text }]}>{creditCount}</Animated.Text>
              <Text style={[styles.creditLabel, { color: colors.subtitle }]}>Free Credits</Text>
            </LinearGradient>
          </View>
          <LinearGradient colors={colors.creditFeaturesBg} style={styles.creditFeatures}>
            <CreditFeatureItem text="Chat with historical figures" colors={colors} />
            <CreditFeatureItem text="Explore fantasy worlds" colors={colors} />
            <CreditFeatureItem text="Get advice from experts" colors={colors} />
          </LinearGradient>
          <NextButton title="Continue" onPress={handleNext} colors={colors} icon="arrow-forward" />
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
});

interface RatingStepProps extends StepProps {
  rating: number;
  setRating: (rating: number) => void;
}

const RatingStep: React.FC<RatingStepProps> = React.memo(({
  isDarkMode, colors, fadeAnim, scaleAnim, slideAnim, handleNext, rating, setRating
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <LinearGradient colors={colors.backgroundGradient} style={styles.gradientBackground}>
        <Animated.View style={[styles.giftContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateX: slideAnim }] }]}>
          <Text style={[styles.title, { color: colors.text }]}>Enjoying Fantasy AI?</Text>
          <Text style={[styles.giftDescription, { color: colors.subtitle }]}>A quick rating helps others discover the world of AI characters. We'd appreciate your feedback!</Text>
          <LinearGradient colors={colors.creditFeaturesBg} style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starButton}>
                <Ionicons
                  name={rating >= star ? 'star' : 'star-outline'}
                  size={38}
                  color={rating >= star ? colors.starColor : colors.starOutlineColor}
                  style={styles.starIcon}
                />
              </TouchableOpacity>
            ))}
          </LinearGradient>
          <NextButton title="Continue" onPress={handleNext} colors={colors} icon="arrow-forward" />
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
});

interface CompletionStepProps extends StepProps {
  completeOnboarding: () => void;
  handleContinueAsGuest: () => void;
}

const CompletionStep: React.FC<CompletionStepProps> = React.memo(({
  isDarkMode, colors, fadeAnim, scaleAnim, slideAnim, completeOnboarding, handleContinueAsGuest
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <LinearGradient colors={colors.backgroundGradient} style={styles.gradientBackground}>
        <Animated.View style={[styles.giftContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateX: slideAnim }] }]}>
          <Animated.View style={[styles.completionCircle, { backgroundColor: colors.completionCircleBg, transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] }]}>
            <Ionicons name="checkmark" size={80} color={colors.buttonText} />
          </Animated.View>
          <Text style={[styles.title, { color: colors.text }]}>Ready to Explore?</Text>
          <Text style={[styles.giftDescription, { color: colors.subtitle }]}>Your journey into conversation starts now. Chat with anyone, anytime, anywhere!</Text>
          <NextButton title="Get Started" onPress={completeOnboarding} colors={colors} icon="rocket-outline" />
          <TouchableOpacity style={[styles.guestButton, { borderColor: colors.guestButtonBorder, backgroundColor: colors.guestButtonBg }]} onPress={handleContinueAsGuest}>
            <Text style={[styles.guestButtonText, { color: colors.guestButtonText }]}>Continue as Guest</Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
});

// --- Helper Components ---

interface InterestItemProps {
  item: InterestCategory;
  selected: boolean;
  onPress: (id: number) => void;
  colors: ReturnType<typeof getThemeColors>;
}

const InterestItem: React.FC<InterestItemProps> = ({ item, selected, onPress, colors }) => (
  <TouchableOpacity
    style={[
      styles.interestItem,
      { backgroundColor: colors.interestItemBg, borderColor: selected ? colors.selectedInterestBorder : colors.interestItemBorder },
      selected && styles.selectedInterest,
    ]}
    onPress={() => onPress(item.id)}
    activeOpacity={0.7}
  >
    <LinearGradient
      colors={selected ? colors.selectedIconBg : colors.interestIconBg}
      style={[styles.iconContainer, selected && styles.selectedIconContainer]}
    >
      <Ionicons name={item.icon} size={22} color={selected ? colors.selectedIconColor : colors.interestIconColor} />
    </LinearGradient>
    <Text style={[styles.interestText, { color: selected ? colors.selectedInterestText : colors.text }]}>
      {item.title}
    </Text>
    {selected && (
      <View style={styles.checkmarkContainer}>
        <Ionicons name="checkmark-circle" size={20} color={colors.selectedInterestBorder} />
      </View>
    )}
  </TouchableOpacity>
);

interface NextButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  colors: ReturnType<typeof getThemeColors>;
  icon?: keyof typeof Ionicons.glyphMap;
}

const NextButton: React.FC<NextButtonProps> = ({ title, onPress, disabled = false, colors, icon }) => (
  <TouchableOpacity
    style={[styles.nextButton, disabled && { opacity: colors.disabledButtonOpacity }]}
    onPress={onPress}
    disabled={disabled}
  >
    <LinearGradient colors={colors.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
      <Text style={[styles.nextButtonText, { color: colors.buttonText }]}>{title}</Text>
      {icon && <Ionicons name={icon} size={20} color={colors.buttonText} style={{ marginLeft: 8 }} />}
    </LinearGradient>
  </TouchableOpacity>
);

interface CreditFeatureItemProps {
  text: string;
  colors: ReturnType<typeof getThemeColors>;
}

const CreditFeatureItem: React.FC<CreditFeatureItemProps> = ({ text, colors }) => (
  <View style={styles.creditFeatureItem}>
    <Ionicons name="checkmark-circle" size={24} color={colors.checkmarkColor} />
    <Text style={[styles.creditFeatureText, { color: colors.text }]}>{text}</Text>
  </View>
);

// --- Styles ---
// Styles remain largely the same, minor adjustments might be needed if component structure changed significantly
// Styles remain largely the same, minor adjustments might be needed if component structure changed significantly

// --- Exports ---
export { OnboardingScreenComponent as OnboardingScreen }; // Named export
export default OnboardingScreenComponent; // Default export