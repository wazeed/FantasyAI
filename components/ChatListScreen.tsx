import React, { useContext, useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Animated,
  ImageSourcePropType,
} from 'react-native';
import { useNavigation, NavigationProp, useFocusEffect, useTheme } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import * as conversationService from '../services/conversationService';
import * as characterService from '../services/characterService';
// Import helper type and specific service types
import { Tables } from '../types/database';
import { RecentChatInfo } from '../services/conversationService'; // Import the correct type
import { formatDistanceToNow } from 'date-fns';

// --- Type Aliases ---
type Character = Tables<'characters'>; // Correct way to get Character row type

// --- Constants ---
const GUEST_CHATS_STORAGE_KEY = 'guestChats';
const PLACEHOLDER_AVATAR = require('../assets/profile-placeholder.png');

// --- Navigation Types ---
type MainTabsParamList = {
  HomeTab: undefined;
  ChatTab: undefined;
  ProfileTab: undefined;
};

type RootStackParamList = {
  MainTabs: undefined;
  Chat: { character: { id: number; name: string; avatar: ImageSourcePropType } }; // Use number for character ID
  // Add other stack screens if needed
};

type ChatListScreenNavigationProp = BottomTabNavigationProp<MainTabsParamList, 'ChatTab'>;

// --- Data Types ---
// Simplified Guest Session structure stored in AsyncStorage
interface GuestSessionData {
    id: string; // Typically characterId for guest sessions
    name: string;
    lastMessage: string;
    avatar: string | null; // Store URI string or null
    characterId: number; // Ensure this is stored as number if possible, or parse
    lastInteractionAt: string; // ISO timestamp string
}

// UI Data structure
interface ChatSession {
  id: number; // Use character ID as the unique key for the list from getRecentChats
  name: string;
  lastMessage: string;
  avatar: ImageSourcePropType;
  time: string; // Formatted time string
  characterId: number;
  lastInteractionAt: string; // ISO timestamp string (used for sorting)
}

// --- Helper Functions ---
function formatTimeAgo(timestamp: string | null): string {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (e) {
    console.error("Error formatting date:", e);
    return '';
  }
}

function getParentNavigator(navigation: ChatListScreenNavigationProp): NavigationProp<RootStackParamList> | undefined {
  try {
    return navigation.getParent<NavigationProp<RootStackParamList>>();
  } catch (e) {
    console.error("Could not get parent navigator. Ensure ChatListScreen is nested correctly.", e);
    return undefined;
  }
}

// --- Chat List Item Component ---
interface ChatListItemProps {
  item: ChatSession;
  index: number;
  onPress: (item: ChatSession) => void;
  theme: ReturnType<typeof useTheme>;
  avatarSize: number;
}

const ChatListItem = memo(({ item, index, onPress, theme, avatarSize }: ChatListItemProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        style={[
          styles.chatItem,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={() => onPress(item)}
        activeOpacity={0.7}
      >
        <Image
          source={item.avatar}
          style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
        />
        <View style={styles.chatInfo}>
          <Text style={[styles.chatName, { color: theme.colors.text }]} numberOfLines={1}>{item.name}</Text>
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
});
ChatListItem.displayName = 'ChatListItem'; // Add display name for debugging

// --- Main Screen Component ---
export default function ChatListScreen({ navigation }: { navigation: ChatListScreenNavigationProp }) {
  const { isDarkMode } = useContext(ThemeContext);
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { user, isGuest } = useAuth();

  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadChats = async () => {
        if (!isActive) return;
        setIsLoading(true);
        setError(null);
        let fetchedChats: ChatSession[] = [];

        try {
          if (isGuest) {
            // --- Guest User Logic ---
            const storedChats = await AsyncStorage.getItem(GUEST_CHATS_STORAGE_KEY);
            if (storedChats) {
              let guestSessions: GuestSessionData[] = []; // Use the simplified type
              try {
                const parsedData = JSON.parse(storedChats);
                 // Basic validation
                if (Array.isArray(parsedData)) {
                    // Further validation could be added here to check object structure
                    guestSessions = parsedData as GuestSessionData[];
                } else {
                    console.warn("Invalid guest chat data found in AsyncStorage (not an array).");
                    await AsyncStorage.removeItem(GUEST_CHATS_STORAGE_KEY);
                }
              } catch (parseError) {
                console.error("Error parsing guest chats from AsyncStorage:", parseError);
                await AsyncStorage.removeItem(GUEST_CHATS_STORAGE_KEY);
              }

              // Sort by last interaction time (most recent first) - Ensure lastInteractionAt exists
              guestSessions.sort((a, b) => {
                  const timeA = a.lastInteractionAt ? new Date(a.lastInteractionAt).getTime() : 0;
                  const timeB = b.lastInteractionAt ? new Date(b.lastInteractionAt).getTime() : 0;
                  return timeB - timeA;
              });


              // Map to ChatSession with correct avatar type
              fetchedChats = guestSessions.map((session): ChatSession => ({
                id: session.characterId, // Use characterId as id
                name: session.name || 'Unknown Character',
                lastMessage: session.lastMessage || 'No messages yet',
                avatar: session.avatar ? { uri: session.avatar } : PLACEHOLDER_AVATAR,
                time: formatTimeAgo(session.lastInteractionAt),
                characterId: session.characterId,
                lastInteractionAt: session.lastInteractionAt || new Date(0).toISOString(), // Ensure it exists for sorting
              }));
            }
          } else if (user) {
            // --- Logged-in User Logic ---
            // Use the correct service function returning RecentChatInfo[]
            const recentChatInfos = await conversationService.getRecentChats(user.id, 20);

            if (recentChatInfos && recentChatInfos.length > 0) {
              const characterIds = recentChatInfos.map(info => info.character_id.toString()); // Convert IDs to strings
              // Fetch corresponding character details
              const characters = await characterService.getCharactersByIds(characterIds);
              const characterMap = new Map(characters.map(c => [c.id, c]));

              fetchedChats = recentChatInfos.map((info): ChatSession | null => {
                const character = characterMap.get(info.character_id);
                if (!character) return null; // Skip if character details not found

                const lastInteraction = info.last_message_time ?? new Date(0).toISOString();

                return {
                  id: info.character_id, // Use character_id as the unique ID for the list item
                  characterId: info.character_id,
                  name: character.name || 'Unknown Character',
                  lastMessage: info.last_message_content || 'No messages yet',
                  // Use image_url from Character type
                  avatar: character.image_url ? { uri: character.image_url } : PLACEHOLDER_AVATAR,
                  time: formatTimeAgo(info.last_message_time), // Format original timestamp
                  lastInteractionAt: lastInteraction,
                };
              }).filter((chat): chat is ChatSession => chat !== null); // Filter out nulls

              // Sort logged-in chats by last interaction time
              fetchedChats.sort((a, b) => new Date(b.lastInteractionAt).getTime() - new Date(a.lastInteractionAt).getTime());
            }
          }

          if (isActive) {
            setRecentChats(fetchedChats);
          }
        } catch (err: unknown) {
          console.error("Error loading chats:", err);
          if (isActive) {
            setError(`Failed to load chats. ${err instanceof Error ? err.message : 'Please try again.'}`);
          }
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      };

      loadChats();

      return () => {
        isActive = false;
      };
    }, [isGuest, user])
  );

  const handleChatPress = useCallback((chat: ChatSession) => {
    const parentNav = getParentNavigator(navigation);
    if (parentNav) {
      parentNav.navigate('Chat', {
        character: {
          id: chat.characterId, // Pass character ID
          name: chat.name,
          avatar: chat.avatar,
        }
      });
    } else {
      console.warn("Could not navigate to Chat: Parent navigator not found.");
    }
  }, [navigation]);

  const avatarSize = Math.min(60, width * 0.15);

  const renderChatItem = useCallback(({ item, index }: { item: ChatSession; index: number }) => (
    <ChatListItem
      item={item}
      index={index}
      onPress={handleChatPress}
      theme={theme}
      avatarSize={avatarSize}
    />
  ), [handleChatPress, theme, avatarSize]);

  // --- Render Logic ---
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading chats...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centeredContainer}>
           <Ionicons name="alert-circle-outline" size={60} color={theme.colors.notification} />
           <Text style={[styles.errorText, { color: theme.colors.text }]}>Error</Text>
           <Text style={[styles.errorDetails, { color: theme.dark ? '#AAAAAA' : '#666666' }]}>{error}</Text>
           {/* TODO: Add a retry button? */}
        </View>
      );
    }

    return (
      <FlatList
        data={recentChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id.toString()} // Ensure key is string
        style={styles.listStyle}
        contentContainerStyle={styles.listContentContainer}
        ListHeaderComponent={
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Your Chats</Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <Ionicons name="chatbubbles-outline" size={60} color={theme.dark ? '#555' : '#BBB'} />
            <Text style={[styles.emptyStateText, { color: theme.dark ? '#AAAAAA' : '#666666' }]}>
              No active chats yet. Start a conversation from the Home screen!
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    );
  };


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderContent()}
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
      marginTop: 10,
      fontSize: 16,
  },
  errorText: {
      marginTop: 15,
      fontSize: 18,
      fontWeight: 'bold',
  },
  errorDetails: {
      marginTop: 8,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
  },
  listStyle: {
    flex: 1,
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    flexGrow: 1, // Ensure empty list component works correctly
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    marginRight: 12,
    backgroundColor: '#e0e0e0',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  chatName: {
    fontWeight: '600',
    fontSize: 16,
  },
  chatMessage: {
    fontSize: 14,
    marginTop: 3,
  },
  chatTime: {
    fontSize: 12,
    marginLeft: 'auto', // Push time to the right
    // Removed whiteSpace: 'nowrap' - invalid property
  },
  emptyStateContainer: {
    flex: 1, // Takes remaining space
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60, // Add some top margin
    paddingHorizontal: 20,
    minHeight: 200,
  },
  emptyStateText: {
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});