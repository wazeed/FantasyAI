import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { 
  ActivityIndicator, 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  useColorScheme,
  useWindowDimensions,
  SafeAreaView,
  Button,
  Alert
} from 'react-native';
import { AuthContextProvider, useAuth } from './contexts/AuthContext';
import { OnboardingProvider, useOnboarding } from './contexts/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';
import LoginScreen from './components/LoginScreen';
import EmailSignIn from './components/EmailSignIn';
import HomeScreen from './components/HomeScreen';
import ChatScreen from './components/ChatScreen';
import ProfileScreen from './components/ProfileScreen';
import EditProfileScreen from './components/EditProfileScreen';
import SettingsScreen from './components/SettingsScreen';
import PrivacySettingsScreen from './components/PrivacySettingsScreen';
import NotificationSettingsScreen from './components/NotificationSettingsScreen';
import SecuritySettingsScreen from './components/SecuritySettingsScreen';
import FAQsScreen from './components/FAQsScreen';
import ReportProblemScreen from './components/ReportProblemScreen'; 
import HelpCenterScreen from './components/HelpCenterScreen';
import ContactUsScreen from './components/ContactUsScreen';
import OnboardingScreen from './components/OnboardingScreen';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeProvider, ThemeContext } from './contexts/ThemeContext';
import SubscriptionScreen from './components/SubscriptionScreen';
import SubscriptionOfferScreen from './components/SubscriptionOfferScreen';
import DiscountOfferScreen from './components/DiscountOfferScreen';

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

// Create a responsive ChatListScreen to list available characters
function ChatListScreen({ navigation }) {
  const { isDarkMode } = React.useContext(ThemeContext);
  const theme = isDarkMode ? DarkTheme : LightTheme;
  const { width } = useWindowDimensions();
  
  // Calculate dynamic sizes based on screen width
  const trendingItemWidth = Math.min(140, width * 0.38);
  const avatarSize = Math.min(70, width * 0.18);
  
  // Sample data for recent and trending characters
  const recentChats = [
    { id: 1, name: 'Sarah', lastMessage: 'How are you doing today?', avatar: require('./assets/char1.png'), time: '2m ago' },
    { id: 2, name: 'David', lastMessage: 'Did you see the latest update?', avatar: require('./assets/char2.png'), time: '1h ago' },
    { id: 3, name: 'Emma', lastMessage: 'Thanks for your help!', avatar: require('./assets/char3.png'), time: 'Yesterday' },
  ];
  
  const trendingCharacters = [
    { id: 4, name: 'Coach Mike', description: 'Fitness & Motivation', avatar: require('./assets/char1.png') },
    { id: 5, name: 'Dr. Lisa', description: 'Health & Wellness', avatar: require('./assets/char2.png') },
    { id: 6, name: 'Chef Antonio', description: 'Cooking & Recipes', avatar: require('./assets/char3.png') },
    { id: 7, name: 'Tutor Max', description: 'Learning & Education', avatar: require('./assets/char1.png') },
    { id: 8, name: 'Artist Maya', description: 'Art & Creativity', avatar: require('./assets/char2.png') },
    { id: 9, name: 'Coder Sam', description: 'Programming', avatar: require('./assets/char3.png') },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: width * 0.04 }}>
          {/* Trending Characters - Horizontal Scrolling */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Trending Characters</Text>
          
          <ScrollView 
            horizontal={true} 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={[styles.trendingScrollContainer, { paddingHorizontal: width * 0.02 }]}
            decelerationRate="fast"
            snapToInterval={trendingItemWidth + width * 0.04}
            snapToAlignment="start"
          >
            {trendingCharacters.map((character) => (
              <TouchableOpacity
                key={character.id}
                style={[
                  styles.trendingItemHorizontal, 
                  { 
                    backgroundColor: theme.colors.card, 
                    borderColor: theme.colors.border,
                    width: trendingItemWidth,
                    marginRight: width * 0.04
                  }
                ]}
                onPress={() => navigation.navigate('Chat', { character })}
              >
                <Image 
                  source={character.avatar} 
                  style={[
                    styles.trendingAvatar, 
                    { 
                      width: avatarSize, 
                      height: avatarSize, 
                      borderRadius: avatarSize / 2 
                    }
                  ]} 
                />
                <Text 
                  style={[styles.trendingName, { color: theme.colors.text }]} 
                  numberOfLines={1}
                >
                  {character.name}
                </Text>
                <Text 
                  style={[styles.trendingDesc, { color: isDarkMode ? '#AAAAAA' : '#666666' }]} 
                  numberOfLines={2}
                >
                  {character.description}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Recent Chats - Vertical Scrolling */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 24 }]}>Recent Chats</Text>
          
          {recentChats.map((chat) => (
            <TouchableOpacity
              key={chat.id}
              style={[
                styles.chatItem, 
                { 
                  backgroundColor: theme.colors.card, 
                  borderColor: theme.colors.border,
                  marginBottom: width * 0.03
                }
              ]}
              onPress={() => navigation.navigate('Chat', { character: chat })}
            >
              <Image source={chat.avatar} style={styles.avatar} />
              <View style={styles.chatInfo}>
                <Text style={[styles.chatName, { color: theme.colors.text }]}>{chat.name}</Text>
                <Text 
                  style={[styles.chatMessage, { color: isDarkMode ? '#AAAAAA' : '#666666' }]} 
                  numberOfLines={1}
                >
                  {chat.lastMessage}
                </Text>
              </View>
              <Text style={[styles.chatTime, { color: isDarkMode ? '#888888' : '#999999' }]}>{chat.time}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Bottom Tab Navigator
function MainTabNavigator() {
  const { isDarkMode } = React.useContext(ThemeContext);
  const theme = isDarkMode ? DarkTheme : LightTheme;

  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ChatTab') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
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

// Wrapper for ProfileScreen that includes reset onboarding button
function ProfileTabWithReset({ navigation }) {
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
      <ProfileScreen navigation={navigation} />
      <View style={[styles.resetButtonContainer, { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' }]}>
        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: isDarkMode ? '#333333' : '#F0F0F0' }]}
          onPress={handleResetOnboarding}
        >
          <Text style={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}>Reset Onboarding (Dev Only)</Text>
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
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' }]}>
        <ActivityIndicator size="large" color={isDarkMode ? '#FFFFFF' : '#000000'} />
      </View>
    );
  }

  const theme = isDarkMode ? DarkTheme : LightTheme;

  const commonHeaderStyle = {
    headerStyle: {
      backgroundColor: theme.colors.card,
      elevation: 0, // Remove shadow on Android
      shadowOpacity: 0, // Remove shadow on iOS
    },
    headerTitleStyle: {
      color: theme.colors.text,
      fontWeight: '500' as const, // Type assertion to fix TypeScript error
      fontSize: Math.min(18, width * 0.045),
    },
    headerTintColor: theme.colors.text,
    headerShadowVisible: false, // Remove the bottom border
    headerBackTitleVisible: false, // iOS only: hide the back button title
  };

  return (
    <NavigationContainer theme={theme}>
      {!user && !isGuest ? (
        <Stack.Navigator
          id={undefined}
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
        <Stack.Navigator 
          id={undefined}
          screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator 
          id={undefined}
          screenOptions={{ 
            headerShown: false, // Default to no header for the MainTabs
            contentStyle: { backgroundColor: theme.colors.background },
            animation: 'fade',
          }}
        >
          <Stack.Screen 
            name="MainTabs" 
            component={MainTabNavigator} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen} 
            options={({ route }) => ({
              // Only show header for chat screen with character name
              headerShown: true,
              title: route.params?.character?.name || 'Chat',
              ...commonHeaderStyle,
            })}
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
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '500',
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 40,
    textAlign: 'center',
  },
  signOutButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  signOutText: {
    fontWeight: '500',
    fontSize: 16,
  },
  characterButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  characterButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Styles for ChatListScreen
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    marginLeft: 4,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  chatMessage: {
    fontSize: 14,
  },
  chatTime: {
    fontSize: 12,
    marginLeft: 8,
  },
  // Trending characters styles
  trendingScrollContainer: {
    paddingVertical: 10,
  },
  trendingItemHorizontal: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  trendingAvatar: {
    marginBottom: 12,
  },
  trendingName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  trendingDesc: {
    fontSize: 13,
    textAlign: 'center',
  },
  resetButtonContainer: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#CCCCCC',
  },
  resetButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 