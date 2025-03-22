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
  const [creditCount, setCreditCount] = useState(0);

  useEffect(() => {
    // Animate in the current screen
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
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
    // Reset animations for the next screen
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
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

  // Renders the interests selection step
  const renderInterestsStep = () => {
    return (
      <SafeAreaView style={[styles.container, isDarkMode ? styles.darkContainer : styles.lightContainer]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        
        <Animated.View 
          style={[
            styles.contentContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          <Text style={[styles.title, isDarkMode ? styles.darkText : styles.lightText]}>
            What are your interests?
          </Text>
          
          <Text style={[styles.subtitle, isDarkMode ? styles.darkSubtitle : styles.lightSubtitle]}>
            Pick three or more to personalize your experience
          </Text>
          
          <ScrollView 
            style={{ flex: 1, width: '100%' }}
            contentContainerStyle={{ paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ marginTop: 20 }}>
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
                    <View style={[
                      styles.iconContainer,
                      selectedInterests.includes(item.id) && styles.selectedIconContainer
                    ]}>
                      <Ionicons 
                        name={item.icon} 
                        size={24} 
                        color={selectedInterests.includes(item.id) 
                          ? '#FFFFFF' 
                          : isDarkMode ? '#FFFFFF' : '#333333'} 
                      />
                    </View>
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
                        <Ionicons name="checkmark-circle" size={22} color="#0070F3" />
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
                    <View style={[
                      styles.iconContainer,
                      selectedInterests.includes(item.id) && styles.selectedIconContainer
                    ]}>
                      <Ionicons 
                        name={item.icon} 
                        size={24} 
                        color={selectedInterests.includes(item.id) 
                          ? '#FFFFFF' 
                          : isDarkMode ? '#FFFFFF' : '#333333'} 
                      />
                    </View>
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
                        <Ionicons name="checkmark-circle" size={22} color="#0070F3" />
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
              !canProceed && styles.disabledButton,
              isDarkMode ? styles.darkButton : styles.lightButton
            ]}
            onPress={handleNext}
            disabled={!canProceed}
          >
            <Text style={[styles.nextButtonText, isDarkMode ? styles.darkButtonText : styles.lightButtonText]}>
              Next
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  // Renders the welcome gift step
  const renderWelcomeGiftStep = () => {
    return (
      <SafeAreaView style={[styles.container, isDarkMode ? styles.darkContainer : styles.lightContainer]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        
        <Animated.View 
          style={[
            styles.giftContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
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
            style={[styles.nextButton, isDarkMode ? styles.darkButton : styles.lightButton]}
            onPress={handleNext}
          >
            <Text style={[styles.nextButtonText, isDarkMode ? styles.darkButtonText : styles.lightButtonText]}>
              Claim Gift
            </Text>
            <Ionicons name="gift-outline" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  };

  // Renders the free credits step
  const renderFreeCreditsStep = () => {
    return (
      <SafeAreaView style={[styles.container, isDarkMode ? styles.darkContainer : styles.lightContainer]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        
        <Animated.View 
          style={[
            styles.giftContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={styles.creditBadge}>
            <Ionicons name="star" size={32} color="#FFD700" />
          </View>
          
          <Text style={[styles.title, isDarkMode ? styles.darkText : styles.lightText]}>
            Enjoy Free Credits!
          </Text>
          
          <Text style={[styles.giftDescription, isDarkMode ? styles.darkSubtitle : styles.lightSubtitle]}>
            We've added credits to your account. Use them to create and message with characters.
          </Text>
          
          <View style={styles.creditCounter}>
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
          </View>
          
          <View style={styles.creditFeatures}>
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
          </View>
          
          <TouchableOpacity
            style={[styles.nextButton, isDarkMode ? styles.darkButton : styles.lightButton]}
            onPress={handleNext}
          >
            <Text style={[styles.nextButtonText, isDarkMode ? styles.darkButtonText : styles.lightButtonText]}>
              Continue
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  };

  // Renders the rating request step
  const renderRatingStep = () => {
    return (
      <SafeAreaView style={[styles.container, isDarkMode ? styles.darkContainer : styles.lightContainer]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        
        <Animated.View 
          style={[
            styles.giftContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          <Text style={[styles.title, isDarkMode ? styles.darkText : styles.lightText]}>
            Quick Favor?
          </Text>
          
          <Text style={[styles.giftDescription, isDarkMode ? styles.darkSubtitle : styles.lightSubtitle]}>
            Would you rate us on the App Store? It's crucial for our discoverability and your rating will greatly help us. Thank you!
          </Text>
          
          <View style={styles.ratingContainer}>
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
          </View>
          
          <TouchableOpacity
            style={[styles.nextButton, isDarkMode ? styles.darkButton : styles.lightButton]}
            onPress={handleNext}
          >
            <Text style={[styles.nextButtonText, isDarkMode ? styles.darkButtonText : styles.lightButtonText]}>
              Continue
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  };

  // Renders the final completion step
  const renderCompletionStep = () => {
    return (
      <SafeAreaView style={[styles.container, isDarkMode ? styles.darkContainer : styles.lightContainer]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        
        <Animated.View 
          style={[
            styles.giftContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
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
            style={[styles.nextButton, isDarkMode ? styles.darkButton : styles.lightButton]}
            onPress={completeOnboarding}
          >
            <Text style={[styles.nextButtonText, isDarkMode ? styles.darkButtonText : styles.lightButtonText]}>
              Get Started
            </Text>
            <Ionicons name="rocket-outline" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  lightContainer: {
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 16,
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
    lineHeight: 24,
  },
  darkSubtitle: {
    color: '#AAAAAA',
  },
  lightSubtitle: {
    color: '#666666',
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
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
    marginBottom: 15,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    position: 'relative',
  },
  darkInterestItem: {
    backgroundColor: '#1E1E1E',
    borderColor: '#333333',
  },
  lightInterestItem: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  selectedInterest: {
    borderColor: '#0070F3',
    borderWidth: 2,
    backgroundColor: isDarkMode => isDarkMode ? '#162B47' : '#E8F0FE',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedIconContainer: {
    backgroundColor: '#0070F3',
  },
  interestText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  selectedInterestText: {
    fontWeight: '600',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  bottomContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 0 : 20,
  },
  selectionCount: {
    fontSize: 14,
    marginBottom: 10,
  },
  nextButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  darkButton: {
    backgroundColor: '#0070F3',
  },
  lightButton: {
    backgroundColor: '#0070F3',
  },
  disabledButton: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  darkButtonText: {
    color: '#FFFFFF',
  },
  lightButtonText: {
    color: '#FFFFFF',
  },
  giftContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  giftDescription: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
  },
  giftBox: {
    width: 180,
    height: 180,
    marginBottom: 50,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftBoxTop: {
    width: 140,
    height: 50,
    backgroundColor: '#FF4A85',
    position: 'absolute',
    top: 40,
    borderRadius: 8,
    zIndex: 2,
  },
  giftBoxRibbon: {
    width: 30,
    height: 140,
    backgroundColor: '#FF4A85',
    position: 'absolute',
    left: 55,
    top: -40,
    zIndex: 3,
    borderRadius: 8,
  },
  giftBoxBottom: {
    width: 140,
    height: 120,
    backgroundColor: '#FF6E9E',
    position: 'absolute',
    top: 90,
    borderRadius: 8,
    zIndex: 1,
  },
  giftGlow: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FF6E9E',
    position: 'absolute',
    opacity: 0.3,
    zIndex: 0,
  },
  creditBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#162B47',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  creditCounter: {
    alignItems: 'center',
    marginVertical: 30,
  },
  creditCountText: {
    fontSize: 72,
    fontWeight: 'bold',
  },
  creditLabel: {
    fontSize: 20,
    marginTop: 4,
  },
  creditFeatures: {
    width: '100%',
    marginBottom: 30,
  },
  creditFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  creditFeatureText: {
    fontSize: 18,
    marginLeft: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starButton: {
    padding: 5,
  },
  starIcon: {
    marginHorizontal: 5,
  },
  completionCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  guestButton: {
    width: '100%',
    height: 46,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    borderWidth: 1,
  },
  darkGuestButton: {
    backgroundColor: 'transparent',
    borderColor: '#555555',
  },
  lightGuestButton: {
    backgroundColor: 'transparent',
    borderColor: '#CCCCCC',
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  darkGuestText: {
    color: '#AAAAAA',
  },
  lightGuestText: {
    color: '#777777',
  },
});

export default OnboardingScreen; 