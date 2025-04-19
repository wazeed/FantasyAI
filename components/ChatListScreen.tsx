import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
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
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
// Import getRecentChats directly if it's a named export
import { getRecentChats, RecentChatInfo } from '../services/conversationService'; 
import * as characterService from '../services/characterService';
import { Tables } from '../types/database';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../utils/supabase';
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient

// --- Type Aliases ---
type Character = Tables<'characters'>;

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
  Chat: { character: { id: number; name: string; avatar: ImageSourcePropType } };
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

function getParentNavigator(navigation: ChatListScreenNavigationProp): any {
  try {
    return navigation.getParent();
  } catch (e) {
    console.error("Could not get parent navigator. Ensure ChatListScreen is nested correctly.", e);
    return undefined;
  }
}

// Format conversation data from Supabase into ChatSession for UI
function formatConversation(conversation: any): ChatSession {
  try {
    // Extract character info
    const character = conversation.characters || {};
    
    return {
      id: conversation.id || 0,
      characterId: character.id || conversation.character_id || 0,
      name: character.name || 'Unknown Character',
      lastMessage: conversation.last_message_content || 'No messages yet',
      avatar: character.image_url ? { uri: character.image_url } : PLACEHOLDER_AVATAR,
      time: formatTimeAgo(conversation.last_message_at),
      lastInteractionAt: conversation.last_message_at || new Date(0).toISOString(),
    };
  } catch (error) {
    console.error('Error formatting conversation:', error);
    // Return a fallback object
    return {
      id: 0,
      characterId: 0,
      name: 'Error',
      lastMessage: 'Could not load conversation details',
      avatar: PLACEHOLDER_AVATAR,
      time: '',
      lastInteractionAt: new Date(0).toISOString(),
    };
  }
}

// Get guest chats from AsyncStorage
async function getGuestChats(): Promise<ChatSession[]> {
  try {
    const storedChats = await AsyncStorage.getItem(GUEST_CHATS_STORAGE_KEY);
    if (!storedChats) return [];
    
    const parsedChats = JSON.parse(storedChats);
    if (!Array.isArray(parsedChats)) return [];
    
    return parsedChats.map((chat: any): ChatSession => ({
      id: chat.id || chat.characterId || 0,
      characterId: chat.characterId || 0,
      name: chat.name || 'Unknown Character',
      lastMessage: chat.lastMessage || 'No messages',
      avatar: chat.avatar ? { uri: chat.avatar } : PLACEHOLDER_AVATAR,
      time: formatTimeAgo(chat.lastInteractionAt),
      lastInteractionAt: chat.lastInteractionAt || new Date(0).toISOString(),
    }));
  } catch (error) {
    console.error('Error retrieving guest chats:', error);
    return [];
  }
}

// --- Chat List Item Component ---
interface ChatListItemProps {
  item: ChatSession;
  index: number;
  onPress: (item: ChatSession) => void;
  colors: any;
  avatarSize: number;
}

const ChatListItem = memo(({ item, index, onPress, colors, avatarSize, isDarkMode }: ChatListItemProps & { isDarkMode: boolean }) => { // Add isDarkMode prop
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  // Memoize styles inside the component
  const itemStyles = useMemo(() => StyleSheet.create({
    chatItemContainer: {
      marginBottom: 12,
      borderRadius: 15, // Increased rounding
      overflow: 'hidden', // Needed for border radius on gradient/shadow view
      shadowColor: colors.shadow, // Use theme shadow
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.3 : 0.1, // Adjust opacity for dark/light
      shadowRadius: 4,
      elevation: 3,
    },
    touchableContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14, // Increased padding
      // backgroundColor: colors.cardBg, // Background handled by gradient or solid color
      // borderColor: colors.border, // Border removed, using shadow
      // borderWidth: 1, // Border removed
    },
    avatar: {
      marginRight: 14, // Increased spacing
      backgroundColor: colors.border, // Use border color as placeholder bg
    },
    chatInfo: {
      flex: 1,
      justifyContent: 'center',
      marginRight: 10, // Increased spacing
    },
    chatName: {
      fontWeight: 'bold', // Bolder name
      fontSize: 16,
      color: colors.text,
      marginBottom: 2, // Add space between name and message
    },
    chatMessage: {
      fontSize: 14,
      color: colors.secondaryText,
      // marginTop: 3, // Removed, using marginBottom on name
    },
    chatTime: {
      fontSize: 12,
      color: colors.secondaryText,
      marginLeft: 'auto', // Push time to the right
      alignSelf: 'flex-start', // Align time to the top of the item
      marginTop: 2, // Adjust vertical position slightly
    },
  }), [colors, avatarSize, isDarkMode]);

  return (
    <Animated.View style={[itemStyles.chatItemContainer, { opacity: fadeAnim }]}>
      <TouchableOpacity
        onPress={() => onPress(item)}
        activeOpacity={0.8} // Slightly more feedback on press
      >
        <LinearGradient
          // Use slightly different colors for dark/light mode gradients
          colors={isDarkMode ? [colors.card, '#3a3a4a'] : [colors.card, '#f8f8fa']} // Example subtle gradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={itemStyles.touchableContent}
        >
          <Image
            source={item.avatar}
            style={[itemStyles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
            onError={(e) => console.warn('Avatar load error:', e.nativeEvent.error)}
          />
          <View style={itemStyles.chatInfo}>
            <Text style={itemStyles.chatName} numberOfLines={1}>{item.name}</Text>
            <Text style={itemStyles.chatMessage} numberOfLines={1}>{item.lastMessage}</Text>
          </View>
          <Text style={itemStyles.chatTime}>{item.time}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
});
ChatListItem.displayName = 'ChatListItem';

// --- Main Screen Component ---
export default function ChatListScreen({ navigation }: { navigation: ChatListScreenNavigationProp }) {
  const { colors, styles: themeStyles, isDarkMode } = useTheme(); // Get isDarkMode
  const { width } = useWindowDimensions();
  const { user, isGuest } = useAuth();

  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simplified loadData - primarily for manual refresh, focus effect handles initial load
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('%c ChatListScreen: Reloading chat data', 'color: #3498db', { userId: user?.id || 'guest', isGuest });
      let fetchedChats: ChatSession[] = [];
      if (isGuest) {
        fetchedChats = await getGuestChats();
        console.log('%c ChatListScreen: Reloaded guest chats', 'color: #f39c12', { count: fetchedChats.length });
      } else if (user) {
        // Use the correct service function
        const recentChatInfos = await getRecentChats(user.id, 20); // Use imported function
        if (recentChatInfos && recentChatInfos.length > 0) {
          const characterIds = recentChatInfos.map(info => info.character_id.toString());
          const characters = await characterService.getCharactersByIds(characterIds);
          const characterMap = new Map(characters.map(c => [c.id, c]));

          fetchedChats = recentChatInfos.map((info): ChatSession | null => { // Type info implicitly handled by getRecentChats return type if typed correctly
            const character = characterMap.get(info.character_id);
            if (!character) return null;
            const lastInteraction = info.last_message_time ?? new Date(0).toISOString();
            return {
              id: info.character_id,
              characterId: info.character_id,
              name: character.name || 'Unknown Character',
              lastMessage: info.last_message_content || 'No messages yet',
              avatar: character.image_url ? { uri: character.image_url } : PLACEHOLDER_AVATAR,
              time: formatTimeAgo(info.last_message_time),
              lastInteractionAt: lastInteraction,
            };
          }).filter((chat): chat is ChatSession => chat !== null);

          fetchedChats.sort((a, b) => new Date(b.lastInteractionAt).getTime() - new Date(a.lastInteractionAt).getTime());
          console.log('%c ChatListScreen: Reloaded conversations for logged-in user', 'color: #2ecc71', { count: fetchedChats.length });
        }
      }
      setRecentChats(fetchedChats);
    } catch (err) {
      console.error('%c ChatListScreen: Error reloading chats', 'color: #e74c3c; font-weight: bold', err);
      setError(`Failed to reload chats. ${err instanceof Error ? err.message : 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  }, [user, isGuest]); // Removed user?.id dependency, use user object

  // Remove initial loadData call from useEffect, useFocusEffect handles it
  useEffect(() => {
    console.log('%c ChatListScreen: Component mounted', 'background: #000; color: #bada55; font-size: 12px;');
    // loadData(); // Remove this line
    return () => {
      console.log('%c ChatListScreen: Component unmounted', 'background: #000; color: #ff6b6b; font-size: 12px;');
    };
  }, []); // Keep empty dependency array

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadChatsOnFocus = async () => { // Renamed function for clarity
        if (!isActive) return;
        setIsLoading(true);
        setError(null);
        let fetchedChats: ChatSession[] = [];

        try {
          console.log('%c ChatListScreen: Loading chats on focus', 'color: #8e44ad', { userId: user?.id || 'guest', isGuest });
          if (isGuest) {
            // --- Guest User Logic ---
            fetchedChats = await getGuestChats(); // Use helper
             console.log('%c ChatListScreen: Loaded guest chats on focus', 'color: #f39c12', { count: fetchedChats.length });

          } else if (user) {
            // --- Logged-in User Logic ---
            // Use the correct service function returning RecentChatInfo[]
            const recentChatInfos: RecentChatInfo[] = await getRecentChats(user.id, 20); // Use imported function and type

            if (recentChatInfos && recentChatInfos.length > 0) {
              const characterIds = recentChatInfos.map(info => info.character_id.toString());
              const characters = await characterService.getCharactersByIds(characterIds);
              const characterMap = new Map(characters.map(c => [c.id, c]));

              fetchedChats = recentChatInfos.map((info: RecentChatInfo): ChatSession | null => { // Explicit type for info
                const character = characterMap.get(info.character_id);
                if (!character) return null;
                const lastInteraction = info.last_message_time ?? new Date(0).toISOString();
                return {
                  id: info.character_id,
                  characterId: info.character_id,
                  name: character.name || 'Unknown Character',
                  lastMessage: info.last_message_content || 'No messages yet',
                  avatar: character.image_url ? { uri: character.image_url } : PLACEHOLDER_AVATAR,
                  time: formatTimeAgo(info.last_message_time),
                  lastInteractionAt: lastInteraction,
                };
              }).filter((chat: ChatSession | null): chat is ChatSession => chat !== null); // Explicit type for chat

              fetchedChats.sort((a, b) => new Date(b.lastInteractionAt).getTime() - new Date(a.lastInteractionAt).getTime());
               console.log('%c ChatListScreen: Loaded conversations on focus', 'color: #2ecc71', { count: fetchedChats.length });
            }
          }

          if (isActive) {
            setRecentChats(fetchedChats);
          }
        } catch (err: unknown) {
          console.error("%c ChatListScreen: Error loading chats on focus", 'color: #e74c3c; font-weight: bold', err);
          if (isActive) {
            setError(`Failed to load chats. ${err instanceof Error ? err.message : 'Please try again.'}`);
          }
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      };

      loadChatsOnFocus(); // Call the renamed function

      return () => {
        isActive = false;
      };
    }, [isGuest, user]) // Dependencies remain the same
  );

  const handleChatPress = useCallback(async (chat: ChatSession) => {
    const parentNav = getParentNavigator(navigation);
    if (parentNav) {
      try {
        // Show loading state
        setIsLoading(true);
        
        // Fetch the full character details including model and system_prompt from the service
        const characterId = String(chat.characterId);
        const characterDetails = await characterService.getCharacter(characterId);
        
        // Prepare the character object for the chat screen
        const characterForChat = {
          id: chat.characterId,
          name: chat.name,
          avatar: chat.avatar,
          // Include additional fields from the fetched character
          description: characterDetails?.description || '',
          greeting: characterDetails?.greeting || '',
          // Include OpenRouter-specific fields
          model: characterDetails?.model || 'openai/gpt-3.5-turbo',
          system_prompt: characterDetails?.system_prompt || `You are ${chat.name}, an AI assistant ready to help.`
        };
        
        // Navigate with the enhanced character object
        parentNav.navigate('Chat', {
          character: characterForChat
        });
      } catch (error) {
        console.error("Error fetching character details:", error);
        Alert.alert(
          "Error",
          "Could not load character details. Please try again.",
          [{ text: "OK" }]
        );
      } finally {
        setIsLoading(false);
      }
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
      colors={colors}
      avatarSize={avatarSize}
      isDarkMode={isDarkMode} // Pass isDarkMode
    />
  ), [handleChatPress, colors, avatarSize, isDarkMode]); // Add isDarkMode dependency

  // --- Render Content Based on State ---
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={[styles.centeredContainer, { backgroundColor: 'transparent' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Loading chats...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={[styles.centeredContainer, { backgroundColor: 'transparent' }]}>
           <Ionicons name="cloud-offline-outline" size={60} color={colors.error} />
           <Text style={[styles.errorText, { color: colors.text }]}>Oops!</Text>
           <Text style={[styles.errorDetails, { color: colors.secondaryText }]}>{error}</Text>
           <TouchableOpacity
             // Assuming themeStyles.primaryButton is correctly typed elsewhere
             style={[themeStyles.primaryButton as any, styles.retryButton]} // Cast to any as a temporary workaround for style error
             onPress={loadData}
           >
             <Ionicons name="refresh-outline" size={18} color={themeStyles.primaryButtonText.color} style={{ marginRight: 8 }}/>
             <Text style={themeStyles.primaryButtonText}>Retry</Text>
           </TouchableOpacity>
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Chats</Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <Ionicons name="chatbubbles-outline" size={70} color={colors.secondaryText} style={{ opacity: 0.8 }} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Chats Yet</Text>
            <Text style={[styles.emptyStateText, { color: colors.secondaryText }]}>
              Start a conversation from the Home screen to see it here.
            </Text>
            <TouchableOpacity
              // Assuming themeStyles.primaryButton is correctly typed elsewhere
              style={[themeStyles.primaryButton as any, styles.exploreButton]} // Cast to any as a temporary workaround for style error
              onPress={() => navigation.navigate('HomeTab')}
            >
              <Ionicons name="search-outline" size={18} color={themeStyles.primaryButtonText.color} style={{ marginRight: 8 }}/>
              <Text style={themeStyles.primaryButtonText}>Explore Characters</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={[themeStyles.container, { backgroundColor: 'transparent' }]}> // Make SafeAreaView transparent
      <LinearGradient // Add gradient background to the whole screen
          colors={isDarkMode ? [colors.background, '#2c3e50'] : ['#ffffff', '#eef2f7']} // Example gradient
          style={StyleSheet.absoluteFill} // Make gradient fill the background
      />
      {renderContent()}
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30, // Increased padding
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  errorText: {
    marginTop: 15,
    fontSize: 20, // Larger error title
    fontWeight: '600',
  },
  errorDetails: {
    marginTop: 10,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
  },
  retryButton: {
    marginTop: 25,
    flexDirection: 'row', // Add icon
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  listStyle: {
    flex: 1,
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20, // Increased top padding
    paddingBottom: 30, // Increased bottom padding
    flexGrow: 1, // Ensure empty list component works correctly
  },
  sectionTitle: {
    marginBottom: 20,
    fontSize: 22, // Reduced font size further
    fontWeight: 'bold',
    paddingLeft: 4,
  },
  // ChatListItem styles are now inside the component
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30, // Increased padding
    paddingBottom: 50, // Push content up slightly
    minHeight: 300, // Ensure it takes up space
  },
  emptyStateTitle: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: '600',
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
  },
  exploreButton: {
    marginTop: 25,
    flexDirection: 'row', // Add icon
    alignItems: 'center',
    paddingHorizontal: 20,
  },
});