import React, { useEffect } from 'react'; // Removed unused useState
import { NavigationContainer, DefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabNavigationProp } from '@react-navigation/bottom-tabs'; // Keep BottomTabNavigationProp for ProfileTabWithReset
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
import { ProfileScreen } from './components/ProfileScreen'; // Use named import
import { EditProfileScreen } from './components/EditProfileScreen'; // Use named import
import SettingsScreen from './components/SettingsScreen'; // Assuming this uses default export
import { PrivacySettingsScreen } from './components/PrivacySettingsScreen'; // Use named import
import { NotificationSettingsScreen } from './components/NotificationSettingsScreen'; // Use named import
import { SecuritySettingsScreen } from './components/SecuritySettingsScreen'; // Use named import
import FAQsScreen from './components/FAQsScreen';
import ReportProblemScreen from './components/ReportProblemScreen';
import HelpCenterScreen from './components/HelpCenterScreen';
import ContactUsScreen from './components/ContactUsScreen';
import OnboardingScreen from './components/OnboardingScreen';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, ThemeContext } from './contexts/ThemeContext';
import SubscriptionScreen from './components/SubscriptionScreen';
import SubscriptionOfferScreen from './components/SubscriptionOfferScreen';
import DiscountOfferScreen from './components/DiscountOfferScreen';
import ChatListScreen from './components/ChatListScreen'; // Import the new component
import TermsAndConditionsScreen from './components/TermsAndConditionsScreen';
import PrivacyPolicyScreen from './components/PrivacyPolicyScreen';

SplashScreen.preventAutoHideAsync();

// Define navigation types
type RootStackParamList = {
  Login: undefined;
  EmailSignIn: { isSignUp?: boolean };
  MainTabs: undefined;
  Onboarding: undefined;
  Chat: { character: any }; // Consider defining a Character type later
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

// Elegant light theme configuration
const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#000000', // Black
    background: '#FFFFFF', // White
    card: '#FFFFFF', // White
    text: '#000000', // Black
    border: '#E0E0E0', // Light gray
    notification: '#0070F3', // Accent blue
  },
};

// Elegant dark theme configuration
const DarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: '#FFFFFF', // White
    background: '#121212', // Dark gray
    card: '#1E1E1E', // Dark card
    text: '#FFFFFF', // White
    border: '#333333', // Dark gray
    notification: '#0070F3', // Accent blue
  },
};

// Bottom Tab Navigator
function MainTabNavigator() {
  const { isDarkMode } = React.useContext(ThemeContext);
  const theme = isDarkMode ? DarkTheme : LightTheme;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          // Define icon names based on route and focus state
          let iconName: keyof typeof Ionicons.glyphMap; // Use keyof glyphMap for type safety

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
              iconName = 'alert-circle-outline'; // Fallback icon
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          paddingBottom: 5,
        },
        // Remove all headers from tab screens - we'll handle them in the stack
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatListScreen}
        options={{ title: 'Chat' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileTabWithReset}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Define navigation prop type for ProfileTabWithReset
type ProfileTabNavigationProp = BottomTabNavigationProp<MainTabsParamList, 'ProfileTab'>;

// Wrapper for ProfileScreen that includes a development-only reset onboarding button.
// TODO: Consider moving this to a separate file (e.g., components/profile/ProfileTabContainer.tsx) later.
function ProfileTabWithReset({ navigation }: { navigation: ProfileTabNavigationProp }) {
  const { resetOnboarding } = useOnboarding();
  const { isDarkMode } = React.useContext(ThemeContext);

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
    <View style={{ flex: 1 }}>
      {/* Pass navigation prop; route prop might not be strictly necessary if ProfileScreen doesn't use it directly */}
      <ProfileScreen navigation={navigation} route={{ key: 'ProfileTab', name: 'ProfileTab', params: undefined }} />
      <View style={[styles.resetButtonContainer, { backgroundColor: isDarkMode ? DarkTheme.colors.background : LightTheme.colors.background, borderTopColor: isDarkMode ? DarkTheme.colors.border : LightTheme.colors.border }]}>
        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: isDarkMode ? DarkTheme.colors.card : LightTheme.colors.border }]}
          onPress={handleResetOnboarding}
        >
          <Text style={{ color: isDarkMode ? DarkTheme.colors.text : LightTheme.colors.text }}>Reset Onboarding (Dev Only)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const Navigation = () => {
  const { user, loading, isGuest } = useAuth();
  const { hasCompletedOnboarding } = useOnboarding();
  const { isDarkMode } = React.useContext(ThemeContext);
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch(e => console.warn('SplashScreen hide error:', e)); // Use console.warn
    }
  }, [loading]);

  const theme = React.useMemo(() => isDarkMode ? DarkTheme : LightTheme, [isDarkMode]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.text} />
      </View>
    );
  }

  const commonHeaderStyle = {
    headerStyle: {
      backgroundColor: theme.colors.card,
    },
    headerTitleStyle: {
      color: theme.colors.text,
      fontWeight: '500' as const,
      fontSize: Math.min(18, width * 0.045),
    },
    headerTintColor: theme.colors.text,
    headerShadowVisible: false, // Prefer this over shadowOpacity/elevation
    headerBackTitleVisible: false, // iOS only: hide the back button title
  };

  return (
    <NavigationContainer theme={theme}>
      {/* Conditional rendering based on Auth and Onboarding state */}
      {!user && !isGuest ? (
        // === Authentication Flow ===
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="EmailSignIn" component={EmailSignIn} />
        </Stack.Navigator>
      ) : !hasCompletedOnboarding ? (
        // === Onboarding Flow ===
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </Stack.Navigator>
      ) : (
        // === Main Application Flow ===
        <Stack.Navigator
          screenOptions={{
            headerShown: false, // Default to no header for the MainTabs
            contentStyle: { backgroundColor: theme.colors.background },
            animation: 'fade', // Consider 'slide_from_right' for standard screen transitions
          }}
        >
          <Stack.Screen
            name="MainTabs"
            component={MainTabNavigator}
            // No options needed as header is handled by the Stack default
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              // Header is handled within ChatScreen itself
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{
              headerShown: true,
              title: 'Edit Profile',
              ...commonHeaderStyle,
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              headerShown: true,
              title: 'Settings',
              ...commonHeaderStyle,
            }}
          />
          <Stack.Screen
            name="PrivacySettings"
            component={PrivacySettingsScreen}
            options={{
              headerShown: true,
              title: 'Privacy',
              ...commonHeaderStyle,
            }}
          />
          <Stack.Screen
            name="NotificationSettings"
            component={NotificationSettingsScreen}
            options={{
              headerShown: true,
              title: 'Notifications',
              ...commonHeaderStyle,
            }}
          />
          <Stack.Screen
            name="SecuritySettings"
            component={SecuritySettingsScreen}
            options={{
              headerShown: true,
              title: 'Security',
              ...commonHeaderStyle,
            }}
          />
          <Stack.Screen
            name="FAQs"
            component={FAQsScreen}
            options={{
              headerShown: true,
              title: 'FAQs',
              ...commonHeaderStyle,
            }}
          />
          <Stack.Screen
            name="ReportProblem"
            component={ReportProblemScreen}
            options={{
              headerShown: true,
              title: 'Report a Problem',
              ...commonHeaderStyle,
            }}
          />
          <Stack.Screen
            name="HelpCenter"
            component={HelpCenterScreen}
            options={{
              headerShown: true,
              title: 'Help Center',
              ...commonHeaderStyle,
            }}
          />
          <Stack.Screen
            name="ContactUs"
            component={ContactUsScreen}
            options={{
              headerShown: true,
              title: 'Contact Us',
              ...commonHeaderStyle,
            }}
          />
          <Stack.Screen
            name="TermsAndConditions"
            component={TermsAndConditionsScreen}
            options={{
              headerShown: true,
              title: 'Terms & Conditions',
              ...commonHeaderStyle,
            }}
          />
          <Stack.Screen
            name="PrivacyPolicy"
            component={PrivacyPolicyScreen}
            options={{
              headerShown: true,
              title: 'Privacy Policy',
              ...commonHeaderStyle,
            }}
          />
          <Stack.Screen
            name="SubscriptionScreen"
            component={SubscriptionScreen}
            options={{
              headerShown: true,
              title: 'Premium Plans',
              ...commonHeaderStyle,
            }}
          />
          <Stack.Screen
            name="SubscriptionOfferScreen"
            component={SubscriptionOfferScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="DiscountOfferScreen"
            component={DiscountOfferScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

// Root component providing context providers
export default function App() {
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

// Component rendering Navigation and StatusBar, consuming ThemeContext
function AppContent() {
  const { isDarkMode } = React.useContext(ThemeContext);

  return (
    <>
      <Navigation />
      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </>
  );
}

const styles = StyleSheet.create({
  // Styles used in this file
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Styles for ProfileTabWithReset's dev button
  resetButtonContainer: {
    padding: 15,
    borderTopWidth: 1,
    // Theme-dependent border/background colors applied inline using ThemeContext
  },
  resetButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    // Theme-dependent background color applied inline using ThemeContext
  },
});