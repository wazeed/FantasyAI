import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  SafeAreaView,
  ScrollView,
  FlatList,
  ActivityIndicator, // Added for loading state
  Animated, // Import Animated from react-native
} from 'react-native';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native'; // Added useFocusEffect
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Added AsyncStorage
import { ThemeContext } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
// Reanimated imports (if using reanimated v2+)
// import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext'; // Added useAuth
import * as conversationService from '../services/conversationService'; // Added conversationService
import * as characterService from '../services/characterService'; // Added characterService
import { Character, Conversation } from '../types/database'; // Added Character & Conversation types
import { formatDistanceToNow } from 'date-fns'; // For relative time formatting

// Define navigation types (adjust based on actual navigation structure)
type MainTabsParamList = {
  HomeTab: undefined;
  ChatTab: undefined;
  ProfileTab: undefined;
};

type RootStackParamList = {
  MainTabs: undefined;
  Chat: { character: any }; // Define character type more specifically if possible
  // Add other stack screens if needed
};

// Combine navigation prop types if ChatListScreen is part of a nested structure
type ChatListScreenNavigationProp = BottomTabNavigationProp<MainTabsParamList, 'ChatTab'>;

// Define character/chat types (adjust as needed)
type ChatSession = {
  id: string; // Use conversation ID or character ID
  name: string;
  lastMessage: string;
  avatar: any; // Use appropriate type for image source
  time: string; // Or Date object
  characterId: string;
  conversationId: string; // Added conversation ID
  lastInteractionAt: string; // Added timestamp
};

// Utility function to format time difference
const formatTimeAgo = (timestamp: string | null): string => {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (e) {
    console.error("Error formatting date:", e);
    return ''; // Return empty string or a default value on error
  }
  };
  
  // Removed TrendingCharacter type
  
  // Placeholder function to get parent navigator (adjust based on actual structure)
  const getParentNavigator = (navigation: ChatListScreenNavigationProp): NavigationProp<RootStackParamList> | undefined => {
  try {
    // This might need adjustment depending on your navigator setup
    return navigation.getParent<NavigationProp<RootStackParamList>>();
  } catch (e) {
    console.error("Could not get parent navigator. Ensure ChatListScreen is nested correctly.", e);
    return undefined;
  }
};


export default function ChatListScreen({ navigation }: { navigation: ChatListScreenNavigationProp }) {
  const { isDarkMode } = React.useContext(ThemeContext); // Get isDarkMode from context
  const theme = useTheme(); // Use the hook to get the theme object
  const { width } = useWindowDimensions();

  const [recentChats, setRecentChats] = React.useState<ChatSession[]>([]);
  // Removed trendingCharacters state
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { user, isGuest } = useAuth();

  const GUEST_CHATS_STORAGE_KEY = 'guestChats';

  // Fetch chats when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadChats = async () => {
        setIsLoading(true);
        setError(null);
        // Declare fetchedChats with the correct type here
        let fetchedChats: ChatSession[] = [];
        try {

          if (isGuest) {
            // --- Guest User Logic ---
            const storedChats = await AsyncStorage.getItem(GUEST_CHATS_STORAGE_KEY);
            if (storedChats) {
              // Parse carefully, provide default empty array if parsing fails
              let guestSessions: Omit<ChatSession, 'time'>[] = [];
              try {
                 guestSessions = JSON.parse(storedChats);
                 if (!Array.isArray(guestSessions)) { // Basic validation
                    guestSessions = [];
                    console.warn("Invalid guest chat data found in AsyncStorage.");
                    await AsyncStorage.removeItem(GUEST_CHATS_STORAGE_KEY); // Clear invalid data
                 }
              } catch (parseError) {
                 console.error("Error parsing guest chats from AsyncStorage:", parseError);
                 guestSessions = [];
                 await AsyncStorage.removeItem(GUEST_CHATS_STORAGE_KEY); // Clear invalid data
              }

              // Sort by last interaction time (most recent first)
              guestSessions.sort((a, b) => new Date(b.lastInteractionAt).getTime() - new Date(a.lastInteractionAt).getTime());
              // Format time and map to ChatSession
              fetchedChats = guestSessions.map(session => {
                 // Determine avatar source: placeholder if null, URI if string, otherwise keep original (for logged-in)
                 const avatarSource = session.avatar === null
                   ? require('../assets/profile-placeholder.png')
                   : typeof session.avatar === 'string'
                   ? { uri: session.avatar }
                   : session.avatar; // Fallback for potential number or other types

                 return {
                   ...session,
                   time: formatTimeAgo(session.lastInteractionAt),
                   avatar: avatarSource,
                 };
              });
            }
          } else if (user) {
            // --- Logged-in User Logic ---
            // TODO: Ensure conversationService.getRecentConversations exists and returns Conversation[]
            // Explicitly type the result from the service if possible, otherwise assert or check
            const conversations: Conversation[] = await conversationService.getRecentConversations(user.id, 15);

            if (conversations && conversations.length > 0) {
              // Ensure character_id exists before mapping
              const characterIds = conversations.map((c: Conversation) => c.character_id).filter(id => !!id);
              // Fetch corresponding character details
              const characters = await characterService.getCharactersByIds(characterIds);
              const characterMap = new Map(characters.map((c: Character) => [c.id, c]));

              // Merge conversation and character data, handling potential null lastInteractionAt
              // Map directly and prepare for setting state
              const mappedChats = conversations.map((convo: Conversation) => {
                const character = characterMap.get(convo.character_id);
                const lastInteraction = convo.last_interaction_at ?? ''; // Provide empty string if null

                return {
                  id: convo.id, // Use conversation ID as the unique key
                  conversationId: convo.id,
                  characterId: convo.character_id,
                  name: character?.name || 'Unknown Character',
                  lastMessage: convo.last_message_preview || 'No messages yet',
                  avatar: character?.avatar_url ? { uri: character.avatar_url } : require('../assets/profile-placeholder.png'), // Handle missing avatar
                  time: formatTimeAgo(lastInteraction), // Pass the guaranteed string or empty string
                  lastInteractionAt: lastInteraction, // Assign the guaranteed string or empty string
                };
              }); // No type assertion needed here, the mapping ensures type correctness
            }
          }
          setRecentChats(fetchedChats);
        } catch (err: any) {
          console.error("Error loading chats:", err);
          setError("Failed to load chats. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };

      loadChats();

      // Optional: Return a cleanup function if needed
      return () => {
        // Cleanup logic here (e.g., cancel subscriptions)
      };
    }, [isGuest, user]) // Rerun effect if user status changes
  );

  // Removed Trending Characters placeholder useEffect

  // Calculate dynamic sizes based on screen width
  // Removed trendingItemWidth calculation
  const avatarSize = Math.min(70, width * 0.18);

  const handleChatPress = (chat: ChatSession) => {
    const parentNav = getParentNavigator(navigation);
    if (parentNav) {
       // Pass necessary character info to Chat screen
       // Ensure the 'character' object matches what ChatScreen expects
       parentNav.navigate('Chat', {
         character: {
           id: chat.characterId, // Pass character ID
           name: chat.name,
           avatar: chat.avatar,
           // Add other necessary character details if needed by ChatScreen
         }
       });
    } else {
      console.warn("Could not navigate to Chat: Parent navigator not found.");
    }
  };

  // Removed handleTrendingPress function

  // Animated Chat Item Component
  const AnimatedChatItem = ({ item, index }: { item: ChatSession; index: number }) => {
    const fadeAnim = React.useRef(new Animated.Value(0)).current; // Initial value for opacity: 0

    React.useEffect(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300, // Fade in duration
        delay: index * 80, // Stagger animation slightly
        useNativeDriver: true, // Use native driver for performance
      }).start();
    }, [fadeAnim, index]);

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity
          key={item.id} // Use unique key here
          style={[
            styles.chatItem, // Use updated chatItem style
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              marginBottom: width * 0.03,
            },
          ]}
          onPress={() => handleChatPress(item)}
        >
          <Image
            source={typeof item.avatar === 'number' ? item.avatar : { uri: item.avatar as string }}
            style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]} // Use avatar style
          />
          <View style={styles.chatInfo}>
            <Text style={[styles.chatName, { color: theme.colors.text }]}>{item.name}</Text>
            <Text
              style={[styles.chatMessage, { color: theme.dark ? '#AAAAAA' : '#666666' }]}
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
          </View>
          <Text style={[styles.chatTime, { color: theme.dark ? '#888888' : '#999999' }]}>{item.time}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.colors.text }}>Loading chats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: width * 0.04 }}>
          {/* Removed Discover Characters Section */}

          {/* Recent Chats List */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 24 }]}>Your Chats</Text>

          {recentChats.length === 0 ? (
             <View style={styles.emptyStateContainer}>
               <Ionicons name="chatbubbles-outline" size={60} color={theme.dark ? '#555' : '#BBB'} /> {/* Use theme.dark */}
               <Text style={[styles.emptyStateText, { color: theme.dark ? '#AAAAAA' : '#666666' }]}> {/* Use theme.dark */}
                 No active chats yet. Start a conversation from the Home screen!
               </Text>
             </View>
           ) : (
             // Use AnimatedChatItem to render the list with animations
             recentChats.map((chat, index) => (
               <AnimatedChatItem key={chat.id} item={chat} index={index} />
             ))
           )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Add styles (can be refined)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    // Removed marginTop: 24 from here, handled in JSX
  },
  // Removed trending styles: trendingScrollContainer, trendingItemHorizontal, trendingAvatar, trendingName, trendingDesc
chatItem: {
  flexDirection: 'row',
  alignItems: 'center',
  borderRadius: 12, // Use 12 for consistency
  padding: 12,      // Keep padding 12
  borderWidth: 1,   // Keep border width 1
  // Add shadow for card effect
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
  // Removed duplicate padding, borderRadius, borderWidth
},
avatar: {
  width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  chatMessage: {
    fontSize: 14,
    marginTop: 2,
  },
  chatTime: {
    fontSize: 12,
    marginLeft: 10,
  },
   emptyStateContainer: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     marginTop: 50,
     paddingHorizontal: 20,
   },
   emptyStateText: {
     marginTop: 15,
     fontSize: 16,
     textAlign: 'center',
     lineHeight: 22,
   },
});