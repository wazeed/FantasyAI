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
} from 'react-native';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native'; // Added useFocusEffect
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Added AsyncStorage
import { ThemeContext } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
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


type TrendingCharacter = {
  id: string;
  name: string;
  description: string;
  avatar: any;
};

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
  const [trendingCharacters, setTrendingCharacters] = React.useState<TrendingCharacter[]>([]); // Keep or remove trending based on design
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

  // --- Placeholder for Trending Characters (can be removed or fetched separately) ---
   React.useEffect(() => {
     const loadTrending = async () => {
       // Simulate fetching trending characters
       const fetchedTrending: TrendingCharacter[] = [
         { id: 'char1', name: 'Coach Mike', description: 'Fitness & Motivation', avatar: require('../assets/char1.png') },
         { id: 'char2', name: 'Dr. Lisa', description: 'Health & Wellness', avatar: require('../assets/char2.png') },
         { id: 'char3', name: 'Chef Antonio', description: 'Cooking & Recipes', avatar: require('../assets/char3.png') },
       ];
       setTrendingCharacters(fetchedTrending);
     };
     loadTrending();
   }, []);
  // --- End Placeholder ---


  // Calculate dynamic sizes based on screen width
  const trendingItemWidth = Math.min(140, width * 0.38);
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

  const handleTrendingPress = (character: TrendingCharacter) => {
     const parentNav = getParentNavigator(navigation);
     if (parentNav) {
       parentNav.navigate('Chat', { character }); // Pass the whole character object
     } else {
       console.warn("Could not navigate to Chat: Parent navigator not found.");
     }
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
          {/* Trending Characters (Optional - Keep or remove based on design) */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Discover Characters</Text>
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
                onPress={() => handleTrendingPress(character)}
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
                  style={[styles.trendingDesc, { color: theme.dark ? '#AAAAAA' : '#666666' }]} // Use theme.dark
                  numberOfLines={2}
                >
                  {character.description}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

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
             recentChats.map((chat) => (
                <TouchableOpacity
                  key={chat.id} // Use conversation ID or a unique key
                  style={[
                    styles.chatItem,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                      marginBottom: width * 0.03
                    }
                  ]}
                  onPress={() => handleChatPress(chat)}
                >
                  <Image source={chat.avatar} style={styles.avatar} />
                  <View style={styles.chatInfo}>
                    <Text style={[styles.chatName, { color: theme.colors.text }]}>{chat.name}</Text>
                    <Text
                      style={[styles.chatMessage, { color: theme.dark ? '#AAAAAA' : '#666666' }]} // Use theme.dark
                      numberOfLines={1}
                    >
                      {chat.lastMessage}
                    </Text>
                  </View>
                  <Text style={[styles.chatTime, { color: theme.dark ? '#888888' : '#999999' }]}>{chat.time}</Text> {/* Use theme.dark */}
                </TouchableOpacity>
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
  },
  trendingScrollContainer: {
    paddingVertical: 10,
  },
  trendingItemHorizontal: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  trendingAvatar: {
    marginBottom: 10,
  },
  trendingName: {
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  trendingDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
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