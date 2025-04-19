import React, { useEffect } from 'react';
import Superwall from '@superwall/react-native-superwall';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  Alert
} from 'react-native';
import { AuthContextProvider, useAuth } from './contexts/AuthContext';
import { OnboardingProvider, useOnboarding } from './contexts/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';
import LoginScreen from './components/LoginScreen';
import EmailSignIn from './components/EmailSignIn';
import HomeScreen from './components/HomeScreen';
import ChatScreen from './components/ChatScreen';
import { ProfileScreen } from './components/ProfileScreen'; 
import { EditProfileScreen } from './components/EditProfileScreen';
import SettingsScreen from './components/SettingsScreen';
import { PrivacySettingsScreen } from './components/PrivacySettingsScreen';
import { NotificationSettingsScreen } from './components/NotificationSettingsScreen';
import { SecuritySettingsScreen } from './components/SecuritySettingsScreen';
import FAQsScreen from './components/FAQsScreen';
import ReportProblemScreen from './components/ReportProblemScreen';
import HelpCenterScreen from './components/HelpCenterScreen';
import ContactUsScreen from './components/ContactUsScreen';
import OnboardingScreen from './components/OnboardingScreen';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import SubscriptionScreen from './components/SubscriptionScreen';
import SubscriptionOfferScreen from './components/SubscriptionOfferScreen';
import DiscountOfferScreen from './components/DiscountOfferScreen';
import ChatListScreen from './components/ChatListScreen';
import TermsAndConditionsScreen from './components/TermsAndConditionsScreen';
import PrivacyPolicyScreen from './components/PrivacyPolicyScreen';

SplashScreen.preventAutoHideAsync();

// Define navigation types
type RootStackParamList = {
  Login: undefined;
  EmailSignIn: { isSignUp?: boolean };
  MainTabs: undefined;
  Onboarding: undefined;
  Chat: { character: any };
  EditProfile: undefined;
  Settings: undefined;
  PrivacySettings: undefined;
  NotificationSettings: undefined;
  SecuritySettings: undefined;
  FAQs: undefined;
  ReportProblem: undefined;
  HelpCenter: undefined;
  ContactUs: undefined;
  SubscriptionScreen: { isSpecialOffer?: boolean };
  SubscriptionOfferScreen: undefined;
  DiscountOfferScreen: { fromCharacter?: boolean };
  TermsAndConditions: undefined;
  PrivacyPolicy: undefined;
};

type MainTabsParamList = {
  HomeTab: undefined;
  ChatTab: undefined;
  ProfileTab: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabsParamList>();

// Bottom Tab Navigator
function MainTabNavigator() {
  const { colors, isDarkMode } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'HomeTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'ChatTab':
              iconName = focused ? 'chatbubble' : 'chatbubble-outline';
              break;
            case 'ProfileTab':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'alert-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          // Add styles for label if needed
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="ChatTab" component={ChatListScreen} options={{ title: 'Chats' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// Define navigation prop type for ProfileTabWithReset
type ProfileTabNavigationProp = BottomTabNavigationProp<MainTabsParamList, 'ProfileTab'>;

// Wrapper for ProfileScreen that includes a development-only reset onboarding button.
function ProfileTabWithReset({ navigation }: { navigation: ProfileTabNavigationProp }) {
  const { resetOnboarding } = useOnboarding();
  const { colors, styles } = useTheme();

  const handleResetOnboarding = () => {
    Alert.alert(
      "Reset Onboarding",
      "Are you sure you want to reset the onboarding process? You will see the onboarding screens again next time you open the app.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Reset",
          onPress: async () => {
            await resetOnboarding();
            Alert.alert("Success", "Onboarding has been reset. Restart the app to see the onboarding screens.");
          },
          style: "destructive"
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ProfileScreen 
        navigation={navigation} 
        route={{ key: 'ProfileTab', name: 'ProfileTab', params: undefined }} 
      />
      <View style={[localStyles.resetButtonContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[localStyles.resetButton, { backgroundColor: colors.card }]}
          onPress={handleResetOnboarding}
        >
          <Text style={{ color: colors.text }}>Reset Onboarding (Dev Only)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const Navigation = () => {
  const { user, isLoading } = useAuth();
  const { hasCompletedOnboarding, isLoading: isOnboardingLoading } = useOnboarding();
  const { isDarkMode, colors } = useTheme();
  const [appIsReady, setAppIsReady] = React.useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Keep the splash screen visible while we fetch resources
        // Add any other async tasks needed before hiding splash screen
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (isLoading || isOnboardingLoading || !appIsReady) {
    // Optionally return a loading indicator centered on the screen
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* Set StatusBar style based on theme */}
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : !user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="EmailSignIn" component={EmailSignIn} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
            <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
            <Stack.Screen name="FAQs" component={FAQsScreen} />
            <Stack.Screen name="ReportProblem" component={ReportProblemScreen} />
            <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
            <Stack.Screen name="ContactUs" component={ContactUsScreen} />
            <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} />
            <Stack.Screen name="SubscriptionOfferScreen" component={SubscriptionOfferScreen} />
            <Stack.Screen name="DiscountOfferScreen" component={DiscountOfferScreen} />
            <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Main App Component
export default function App() {
  useEffect(() => {
    // Corrected Superwall configuration
    Superwall.configure({ apiKey: 'YOUR_SUPERWALL_API_KEY' });
    console.log('Superwall Initialized (Replace with your key)');
  }, []);

  return (
    <ThemeProvider>
      <OnboardingProvider>
        <AuthContextProvider>
          <AppContent />
        </AuthContextProvider>
      </OnboardingProvider>
    </ThemeProvider>
  );
}

// Main App Content
function AppContent() {
  const { user, isGuest, isLoading } = useAuth(); // Add isGuest here
  const { hasCompletedOnboarding, isLoading: isOnboardingLoading } = useOnboarding();
  const { isDarkMode, colors } = useTheme();
  const [appIsReady, setAppIsReady] = React.useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Keep the splash screen visible while we fetch resources
        // Add any other async tasks needed before hiding splash screen
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (isLoading || isOnboardingLoading || !appIsReady) {
    // Optionally return a loading indicator centered on the screen
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : !user && !isGuest ? ( // Updated condition
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="EmailSignIn" component={EmailSignIn} />
          </>
        ) : ( // This covers both logged-in users and guests
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
            <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
            <Stack.Screen name="FAQs" component={FAQsScreen} />
            <Stack.Screen name="ReportProblem" component={ReportProblemScreen} />
            <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
            <Stack.Screen name="ContactUs" component={ContactUsScreen} />
            <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} />
            <Stack.Screen name="SubscriptionOfferScreen" component={SubscriptionOfferScreen} />
            <Stack.Screen name="DiscountOfferScreen" component={DiscountOfferScreen} />
            <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const localStyles = StyleSheet.create({
  // Styles for ProfileTabWithReset's dev button
  resetButtonContainer: {
    padding: 15,
    borderTopWidth: 1,
  },
  resetButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Add a simple centered style for the loading indicator
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});