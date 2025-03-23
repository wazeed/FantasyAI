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

// Interest categories for the first screen
const interestCategories = [
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

// Lifestyle categories
const lifestyleCategories = [
  { id: 12, title: 'Friendship', icon: 'people-outline' },
  { id: 13, title: 'Emotional Wellness', icon: 'pulse-outline' },
];

const OnboardingScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState<number[]>([]);
  const [rating, setRating] = useState(0);
  const { width, height } = useWindowDimensions();
  const { completeOnboarding, resetOnboarding } = useOnboarding();
  const { isDarkMode } = React.useContext(ThemeContext);
  const { skipAuth } = useAuth();
  const navigation = useNavigation();

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
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start();

    // For credits screen, animate the counter
    if (currentStep === 2) {
      Animated.timing(creditCountAnim, {
        toValue: 30,
        duration: 1500,
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
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(giftAnim, {
            toValue: 0,
            duration: 1000,
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
  const canProceed = selectedInterests.length >= 3 || currentStep > 0;

  // Next step handler
  const handleNext = () => {
    if (currentStep < 4) {
      // Animate current screen out before changing step
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 250,
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
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 250,
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
    // resetOnboarding();
  }, []);

  // Get background and card colors based on theme
  const getBackgroundGradient = () => {
    if (isDarkMode) {
      return ['#121212', '#1A1A1A', '#222222'] as const;
    } else {
      return ['#FFFFFF', '#F8FAFF', '#F0F4FF'] as const;
    }
  };

  const getCardGradient = () => {
    if (isDarkMode) {
      return ['#1E1E1E', '#252525'] as const;
    } else {
      return ['#F8F8F8', '#FFFFFF'] as const;
    }
  };

  // Renders the interests selection step
  const renderInterestsStep = () => {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <LinearGradient
          colors={getBackgroundGradient()}
          style={styles.gradientBackground}
        >
          <Animated.View 
            style={[
              styles.contentContainer,
              { 
                opacity: fadeAnim, 
                transform: [
                  { scale: scaleAnim },
                  { translateX: slideAnim }
                ] 
              }
            ]}
          >
            <View style={styles.headingContainer}>
              <Text style={[styles.title, isDarkMode ? styles.darkText : styles.lightText]}>
                What are your interests?
              </Text>
              
              <Text style={[styles.subtitle, isDarkMode ? styles.darkSubtitle : styles.lightSubtitle]}>
                Pick three or more to personalize your experience
              </Text>
            </View>
            
            <ScrollView 
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.categoriesContainer}>
                <Text style={[styles.categoryTitle, isDarkMode ? styles.darkText : styles.lightText]}>
                  Roleplaying
                </Text>
                
                <View style={styles.interestsGrid}>
                  {interestCategories.slice(0, 11).map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.interestItem,
                        selectedInterests.includes(item.id) && styles.selectedInterest,
                        isDarkMode ? styles.darkInterestItem : styles.lightInterestItem
                      ]}
                      onPress={() => toggleInterest(item.id)}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={selectedInterests.includes(item.id) 
                          ? ['#0070F3', '#0063DA'] 
                          : isDarkMode ? ['#2A2A2A', '#333333'] : ['#F0F0F0', '#FAFAFA']}
                        style={[
                          styles.iconContainer,
                          selectedInterests.includes(item.id) && styles.selectedIconContainer
                        ]}
                      >
                        <Ionicons 
                          name={item.icon as any} 
                          size={22} 
                          color={selectedInterests.includes(item.id) 
                            ? '#FFFFFF' 
                            : isDarkMode ? '#FFFFFF' : '#555555'} 
                        />
                      </LinearGradient>
                      <Text 
                        style={[
                          styles.interestText, 
                          isDarkMode ? styles.darkText : styles.lightText,
                          selectedInterests.includes(item.id) && styles.selectedInterestText
                        ]}
                      >
                        {item.title}
                      </Text>
                      {selectedInterests.includes(item.id) && (
                        <View style={styles.checkmarkContainer}>
                          <Ionicons name="checkmark-circle" size={20} color="#0070F3" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                
                <Text style={[styles.categoryTitle, isDarkMode ? styles.darkText : styles.lightText, { marginTop: 30 }]}>
                  Lifestyle
                </Text>
                
                <View style={styles.interestsGrid}>
                  {lifestyleCategories.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.interestItem,
                        selectedInterests.includes(item.id) && styles.selectedInterest,
                        isDarkMode ? styles.darkInterestItem : styles.lightInterestItem
                      ]}
                      onPress={() => toggleInterest(item.id)}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={selectedInterests.includes(item.id) 
                          ? ['#0070F3', '#0063DA'] 
                          : isDarkMode ? ['#2A2A2A', '#333333'] : ['#F0F0F0', '#FAFAFA']}
                        style={[
                          styles.iconContainer,
                          selectedInterests.includes(item.id) && styles.selectedIconContainer
                        ]}
                      >
                        <Ionicons 
                          name={item.icon as any} 
                          size={22} 
                          color={selectedInterests.includes(item.id) 
                            ? '#FFFFFF' 
                            : isDarkMode ? '#FFFFFF' : '#555555'} 
                        />
                      </LinearGradient>
                      <Text 
                        style={[
                          styles.interestText, 
                          isDarkMode ? styles.darkText : styles.lightText,
                          selectedInterests.includes(item.id) && styles.selectedInterestText
                        ]}
                      >
                        {item.title}
                      </Text>
                      {selectedInterests.includes(item.id) && (
                        <View style={styles.checkmarkContainer}>
                          <Ionicons name="checkmark-circle" size={20} color="#0070F3" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </Animated.View>
          
          <View style={styles.bottomContainer}>
            <Text style={[styles.selectionCount, isDarkMode ? styles.darkSubtitle : styles.lightSubtitle]}>
              {selectedInterests.length} of 3 minimum selected
            </Text>
            
            <TouchableOpacity
              style={[
                styles.nextButton,
                !canProceed && styles.disabledButton
              ]}
              onPress={handleNext}
              disabled={!canProceed}
            >
              <LinearGradient
                colors={['#0070F3', '#0063DA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.nextButtonText}>
                  Continue
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  };

  // Renders the welcome gift step
  const renderWelcomeGiftStep = () => {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <LinearGradient
          colors={getBackgroundGradient()}
          style={styles.gradientBackground}
        >
          <Animated.View 
            style={[
              styles.giftContainer,
              { 
                opacity: fadeAnim, 
                transform: [
                  { scale: scaleAnim },
                  { translateX: slideAnim }
                ] 
              }
            ]}
          >
            <Text style={[styles.title, isDarkMode ? styles.darkText : styles.lightText]}>
              You have a Welcome Surprise!
            </Text>
            
            <Text style={[styles.giftDescription, isDarkMode ? styles.darkSubtitle : styles.lightSubtitle]}>
              Tap to unveil your special gift and kickstart your fantasy adventure!
            </Text>
            
            <Animated.View 
              style={[
                styles.giftBox, 
                { 
                  transform: [
                    { translateY: giftAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -20]
                    })}
                  ] 
                }
              ]}
            >
              <View style={styles.giftBoxTop}>
                <View style={styles.giftBoxRibbon} />
              </View>
              <View style={styles.giftBoxBottom} />
              
              <Animated.View 
                style={[
                  styles.giftGlow,
                  {
                    opacity: giftAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.8]
                    })
                  }
                ]}
              />
            </Animated.View>
            
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
            >
              <LinearGradient
                colors={['#0070F3', '#0063DA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.nextButtonText}>
                  Continue
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </SafeAreaView>
    );
  };

  // Renders the free credits step
  const renderFreeCreditsStep = () => {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <LinearGradient
          colors={getBackgroundGradient()}
          style={styles.gradientBackground}
        >
          <Animated.View 
            style={[
              styles.giftContainer,
              { 
                opacity: fadeAnim, 
                transform: [
                  { scale: scaleAnim },
                  { translateX: slideAnim }
                ] 
              }
            ]}
          >
            <LinearGradient
              colors={['#162B47', '#1D3759']}
              style={styles.creditBadge}
            >
              <Ionicons name="star" size={32} color="#FFD700" />
            </LinearGradient>
            
            <Text style={[styles.title, isDarkMode ? styles.darkText : styles.lightText]}>
              Enjoy Free Credits!
            </Text>
            
            <Text style={[styles.giftDescription, isDarkMode ? styles.darkSubtitle : styles.lightSubtitle]}>
              We've added credits to your account. Use them to create and message with characters.
            </Text>
            
            <View style={styles.creditCounter}>
              <LinearGradient
                colors={isDarkMode ? ['#1A1D21', '#252A33'] : ['#F0F4FF', '#E6EDFF']}
                style={styles.creditCounterBg}
              >
                <Animated.Text 
                  style={[
                    styles.creditCountText, 
                    isDarkMode ? styles.darkText : styles.lightText
                  ]}
                >
                  {creditCount}
                </Animated.Text>
                <Text style={[styles.creditLabel, isDarkMode ? styles.darkSubtitle : styles.lightSubtitle]}>
                  Free Credits
                </Text>
              </LinearGradient>
            </View>
            
            <LinearGradient
              colors={isDarkMode ? ['rgba(30, 30, 30, 0.7)', 'rgba(35, 35, 35, 0.7)'] : ['rgba(248, 250, 252, 0.8)', 'rgba(240, 245, 255, 0.8)']}
              style={styles.creditFeatures}
            >
              <View style={styles.creditFeatureItem}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={[styles.creditFeatureText, isDarkMode ? styles.darkText : styles.lightText]}>
                  Create new characters
                </Text>
              </View>
              <View style={styles.creditFeatureItem}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={[styles.creditFeatureText, isDarkMode ? styles.darkText : styles.lightText]}>
                  Engage in deep conversations
                </Text>
              </View>
              <View style={styles.creditFeatureItem}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={[styles.creditFeatureText, isDarkMode ? styles.darkText : styles.lightText]}>
                  Unlock personality traits
                </Text>
              </View>
            </LinearGradient>
            
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
            >
              <LinearGradient
                colors={['#0070F3', '#0063DA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.nextButtonText}>
                  Continue
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </SafeAreaView>
    );
  };

  // Renders the rating request step
  const renderRatingStep = () => {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <LinearGradient
          colors={getBackgroundGradient()}
          style={styles.gradientBackground}
        >
          <Animated.View 
            style={[
              styles.giftContainer,
              { 
                opacity: fadeAnim, 
                transform: [
                  { scale: scaleAnim },
                  { translateX: slideAnim }
                ] 
              }
            ]}
          >
            <Text style={[styles.title, isDarkMode ? styles.darkText : styles.lightText]}>
              Quick Favor?
            </Text>
            
            <Text style={[styles.giftDescription, isDarkMode ? styles.darkSubtitle : styles.lightSubtitle]}>
              Would you rate us on the App Store? It's crucial for our discoverability and your rating will greatly help us. Thank you!
            </Text>
            
            <LinearGradient
              colors={isDarkMode ? ['rgba(30, 30, 30, 0.7)', 'rgba(35, 35, 35, 0.7)'] : ['rgba(248, 250, 252, 0.8)', 'rgba(240, 245, 255, 0.8)']}
              style={styles.ratingContainer}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={rating >= star ? 'star' : 'star-outline'}
                    size={38}
                    color={rating >= star ? '#FFD700' : isDarkMode ? '#FFFFFF' : '#000000'}
                    style={styles.starIcon}
                  />
                </TouchableOpacity>
              ))}
            </LinearGradient>
            
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
            >
              <LinearGradient
                colors={['#0070F3', '#0063DA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.nextButtonText}>
                  Continue
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </SafeAreaView>
    );
  };

  // Renders the final completion step
  const renderCompletionStep = () => {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <LinearGradient
          colors={getBackgroundGradient()}
          style={styles.gradientBackground}
        >
          <Animated.View 
            style={[
              styles.giftContainer,
              { 
                opacity: fadeAnim, 
                transform: [
                  { scale: scaleAnim },
                  { translateX: slideAnim }
                ] 
              }
            ]}
          >
            <Animated.View 
              style={[
                styles.completionCircle,
                { 
                  transform: [
                    { scale: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1]
                      })
                    }
                  ] 
                }
              ]}
            >
              <Ionicons
                name="checkmark"
                size={80}
                color="#FFFFFF"
              />
            </Animated.View>
            
            <Text style={[styles.title, isDarkMode ? styles.darkText : styles.lightText]}>
              All Set!
            </Text>
            
            <Text style={[styles.giftDescription, isDarkMode ? styles.darkSubtitle : styles.lightSubtitle]}>
              Your fantasy adventure begins now. Start chatting with characters that match your interests!
            </Text>
            
            <TouchableOpacity
              style={styles.nextButton}
              onPress={completeOnboarding}
            >
              <LinearGradient
                colors={['#0070F3', '#0063DA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.nextButtonText}>
                  Get Started
                </Text>
                <Ionicons name="rocket-outline" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.guestButton, isDarkMode ? styles.darkGuestButton : styles.lightGuestButton]}
              onPress={handleContinueAsGuest}
            >
              <Text style={[styles.guestButtonText, isDarkMode ? styles.darkGuestText : styles.lightGuestText]}>
                Continue as Guest
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </SafeAreaView>
    );
  };

  // Determines which step to render
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderInterestsStep();
      case 1:
        return renderWelcomeGiftStep();
      case 2:
        return renderFreeCreditsStep();
      case 3:
        return renderRatingStep();
      case 4:
        return renderCompletionStep();
      default:
        return renderInterestsStep();
    }
  };

  return renderStep();
};

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

export default OnboardingScreen; 