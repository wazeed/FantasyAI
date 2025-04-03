import React, { useState, useEffect, useRef, useContext, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Keyboard,
  Modal,
  ImageBackground,
  Animated,
  Alert, // Re-added for permissions/file errors
  Pressable, // Re-added for buttons
  ImageSourcePropType,
  ActivityIndicator, // Re-added for loading states
  GestureResponderEvent, // For typing Pressable events
} from 'react-native';
import * as ImagePicker from 'expo-image-picker'; // Keep for image selection (input)
// import { Audio, Recording } from 'expo-av'; // Keep Recording for input, remove Audio for playback
import { Audio } from 'expo-av'; // Keep Audio for Recording permissions/instance
import * as FileSystem from 'expo-file-system'; // Import FileSystem
// import { Image as ExpoImage } from 'expo-image'; // Removed - No longer displaying images in messages
import { supabase } from '../utils/supabase'; // Import Supabase client
import { useAuth } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
// import { Ionicons } from '@expo/vector-icons'; // Removed - Mic/Attach icons handled elsewhere or removed if only for audio play
// Re-import if needed for other icons like back arrow, theme selector etc. - Check ChatHeader/ChatInput usage
import { Ionicons } from '@expo/vector-icons'; // Keeping for now, likely used in header/input
import { ParamListBase, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  getChatMessages,
  sendMessage as sendMessageToDb,
  subscribeToNewMessages,
  unsubscribeFromChat,
  Message, // Import the correct Message type
} from '../services/conversationService';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Types and Interfaces ---

type GuestChatSessionData = {
  id: number;
  characterId: number;
  name: string;
  avatar: string | number | null; // Keep consistent with Character type
  lastMessage: string;
  lastInteractionAt: string;
};

// Define RootStackParamList based on project structure/navigation needs
type RootStackParamList = {
  Login: undefined;
  EmailSignIn: { isSignUp?: boolean };
  MainTabs: undefined;
  Onboarding: undefined;
  Chat: { character: Character };
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

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;
type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

interface Character {
  id: number;
  name: string;
  description?: string;
  avatar: ImageSourcePropType | string; // Allow string for URI
  tags?: string[];
  category?: string;
  openingMessage?: string;
  exampleQuestions?: string[];
  greeting?: string;
  image_url?: string; // Keep for potential use
}

interface UIMessage {
  id: string | number;
  text: string; // Keep text for potential captions or fallbacks
  sender: 'user' | 'ai';
  timestamp: number;
  image_url?: string;
  audio_url?: string; // Add optional audio URL
}

interface ChatScreenProps {
  route: ChatScreenRouteProp;
  navigation: NavigationProp;
}

interface MessageItemProps {
  item: UIMessage;
  characterAvatar: ImageSourcePropType | string;
  colors: ReturnType<typeof useDynamicColors>;
  isDarkMode: boolean;
  animation: { fadeAnim: Animated.Value; slideAnim: Animated.Value; scaleAnim: Animated.Value };
}

// Removed comments related to unused imports (Alert, Audio, ActivityIndicator)

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  handleSend: () => void;
  isAISpeaking: boolean;
  colors: ReturnType<typeof useDynamicColors>;
  sendButtonScale: Animated.Value;
  handlePressInSend: () => void;
  handlePressOutSend: () => void;
  onMicPress?: () => void; // Added microphone press handler prop
  onAttachPress?: () => void; // Added attachment press handler prop
  stagedMedia: StagedMedia | null; // Add staged media state prop
  clearStagedMedia: () => void; // Add function to clear staged media
}

interface ChatHeaderProps {
  character: Character;
  colors: ReturnType<typeof useDynamicColors>;
  handleBack: () => void;
  handleThemePress: () => void;
}

interface ThemeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  themes: ChatTheme[];
  selectedTheme: ChatTheme;
  onSelectTheme: (theme: ChatTheme) => void;
  colors: ReturnType<typeof useDynamicColors>;
}

interface TypingIndicatorDisplayProps {
    character: Character;
    colors: ReturnType<typeof useDynamicColors>;
}

interface GuestModeBannerProps {
    colors: ReturnType<typeof useDynamicColors>;
    onUpgradePress: () => void;
}

interface ChatTheme {
  id: string;
  name: string;
  background: ImageSourcePropType | null;
}

interface StagedMedia {
  uri: string;
  base64: string;
  type: 'image' | 'audio';
  mimeType?: string; // Add optional mimeType
}

// Define the structure for OpenRouter message content
type OpenRouterMessageContent =
  | string
  | Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string; detail?: 'auto' | 'low' | 'high' } }
      // Add other potential content types if needed
    >;

// Define the structure for an OpenRouter message
interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: OpenRouterMessageContent;
}

// --- Constants ---

const GUEST_CHATS_STORAGE_KEY = 'guestChats';
const MESSAGE_ANIMATION_DURATION = 300;
const FLATLIST_OPTIMIZATION_PROPS = {
  initialNumToRender: 10,
  maxToRenderPerBatch: 10,
  windowSize: 11, // Default is 21, smaller might be better for chat
};

const CHAT_THEMES: ChatTheme[] = [
  { id: 'default', name: 'Default', background: null },
  { id: 'gradient1', name: 'Sunset', background: require('../assets/chat-bg/gradient1.png') },
  { id: 'gradient2', name: 'Ocean', background: require('../assets/chat-bg/gradient2.png') },
  { id: 'pattern1', name: 'Bubbles', background: require('../assets/chat-bg/pattern1.png') },
  { id: 'pattern2', name: 'Stars', background: require('../assets/chat-bg/pattern2.png') },
];

// --- Helper Functions (Outside Component) ---

function mapDbMessageToUIMessage(dbMsg: Message): UIMessage { // Use the imported Message type
  // Assuming DbMessage has an image_url field now
  return {
    id: dbMsg.id ?? Crypto.randomUUID(),
    text: dbMsg.content ?? (dbMsg.image_url || dbMsg.audio_url ? '' : '[empty message]'), // Empty text if media exists
    sender: (dbMsg.sender ?? 'ai') as 'user' | 'ai',
    timestamp: dbMsg.created_at ? new Date(dbMsg.created_at).getTime() : Date.now(),
    image_url: dbMsg.image_url ?? undefined,
    audio_url: dbMsg.audio_url ?? undefined, // Map audio_url
  };
}

function generateWelcomeMessage(char: Character): string {
  if (char.greeting) return char.greeting;
  if (char.openingMessage) {
    const questionList = (char.exampleQuestions || []).map((q: string) => `• ${q}`).join('\n');
    return `${char.openingMessage}${questionList ? `\n\nHere are some things I can help with:\n${questionList}` : ''}`;
  }
  return `Hello! I'm ${char.name}. How can I help you today?`;
}

// Removed local fetchAIResponse function. Logic moved to Supabase Edge Function 'openrouter-proxy'.

async function updateGuestChatSession(characterId: number, characterName: string, lastMessageText: string): Promise<void> {
  if (isNaN(characterId) || characterId <= 0) return;
  try {
    const now = new Date().toISOString();
    const currentChatsRaw = await AsyncStorage.getItem(GUEST_CHATS_STORAGE_KEY);
    let currentChats: GuestChatSessionData[] = currentChatsRaw ? JSON.parse(currentChatsRaw) : [];

    // Ensure currentChats is an array
    if (!Array.isArray(currentChats)) {
        console.warn('Guest chat data in AsyncStorage was not an array. Resetting.');
        currentChats = [];
    }

    const existingIndex = currentChats.findIndex(chat => chat.characterId === characterId);
    // Use characterId for id as well, assuming it's unique for guest sessions context
    const sessionData: GuestChatSessionData = {
        id: characterId,
        characterId: characterId,
        name: characterName,
        avatar: null, // Avatar isn't stored/needed for guest list view currently
        lastMessage: lastMessageText.substring(0, 100), // Limit length
        lastInteractionAt: now
    };

    if (existingIndex > -1) {
      currentChats[existingIndex] = sessionData;
    } else {
      currentChats.push(sessionData);
    }

    // Sort by most recent interaction
    currentChats.sort((a, b) => new Date(b.lastInteractionAt).getTime() - new Date(a.lastInteractionAt).getTime());

    // Limit the number of stored guest chats
    const limitedChats = currentChats.slice(0, 15);

    await AsyncStorage.setItem(GUEST_CHATS_STORAGE_KEY, JSON.stringify(limitedChats));
  } catch (error) {
    console.error("Error updating guest chat session:", error);
    // Optionally inform the user or log more details
  }
}

// --- Dynamic Colors Hook ---
const useDynamicColors = (isDarkMode: boolean) => {
    return useMemo(() => ({
        background: isDarkMode ? '#121212' : '#F8FAFC', // Slightly off-white light background
        inputBackground: isDarkMode ? '#1E293B' : '#F1F5F9', // Light grey input light mode
        text: isDarkMode ? '#E5E7EB' : '#1E293B', // Dark text light mode
        subText: isDarkMode ? '#94A3B8' : '#64748B', // Grey text
        userBubble: isDarkMode ? '#4F46E5' : '#38BDF8', // Indigo dark, Sky light
        aiBubble: isDarkMode ? '#1E293B' : '#FFFFFF', // Dark grey dark, White light
        aiBubbleShadow: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
        userText: '#FFFFFF', // White text on colored bubble
        aiText: isDarkMode ? '#E5E7EB' : '#1E293B', // Light text dark, Dark text light
        border: isDarkMode ? '#334155' : '#E2E8F0', // Slightly darker border dark, Light border light
        sendButton: isDarkMode ? '#4F46E5' : '#3B82F6', // Indigo dark, Blue light
        primary: isDarkMode ? '#6366F1' : '#3B82F6', // Brighter Indigo dark, Blue light
        secondary: '#8B5CF6', // Purple accent
        card: isDarkMode ? '#1E293B' : '#FFFFFF', // Dark grey card dark, White card light
        accent: isDarkMode ? '#818CF8' : '#93C5FD', // Lighter Indigo dark, Lighter Blue light
        avatarBorder: isDarkMode ? '#4F46E5' : '#FFFFFF', // Indigo border dark, White border light
        messageTimestamp: isDarkMode ? '#64748B' : '#94A3B8', // Grey timestamp
        typingIndicator: isDarkMode ? '#94A3B8' : '#64748B', // Grey typing indicator
        themePreviewBorder: 'rgba(0,0,0,0.1)', // Static light border for theme preview
        themeSelectedBorder: isDarkMode ? '#6366F1' : '#3B82F6', // Primary color for selected theme
        closeButton: isDarkMode ? '#E5E7EB' : '#1E293B', // Text color for close button
    }), [isDarkMode]);
};


// --- Subcomponents ---

const TypingIndicator = React.memo(({ color }: { color: string }) => {
  const yAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  useEffect(() => {
    const createAnimation = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: -5, duration: 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );
    };
    const animations = yAnims.map((anim, index) => createAnimation(anim, index * 150));
    Animated.parallel(animations).start();
    return () => animations.forEach(anim => anim.stop());
  }, [yAnims]); // yAnims is stable

  return (
    <View style={styles.typingDotsContainer}>
      {yAnims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[ styles.typingDot, { backgroundColor: color, transform: [{ translateY: anim }] } ]}
        />
      ))}
    </View>
  );
});

const TypingIndicatorDisplay = React.memo(({ character, colors }: TypingIndicatorDisplayProps) => {
    const getAvatarSource = (avatar: Character['avatar']): ImageSourcePropType => {
        if (typeof avatar === 'number') return avatar;
        if (typeof avatar === 'string' && avatar.startsWith('http')) return { uri: avatar };
        // Add handling for local string paths if necessary, otherwise default
        return require('../assets/profile-placeholder.png'); // Default placeholder
    };

    return (
        <View style={[styles.typingIndicatorContainer, { backgroundColor: colors.background }]}>
            <Image
                source={getAvatarSource(character?.avatar)}
                style={[styles.typingIndicatorAvatar, { borderColor: colors.avatarBorder }]}
                onError={(e) => console.warn("Typing indicator avatar error:", e.nativeEvent.error)}
            />
            <Text style={[styles.typingIndicatorText, { color: colors.subText }]}>
                {character?.name || 'AI'} is typing{' '}
            </Text>
            <TypingIndicator color={colors.typingIndicator} />
        </View>
    );
});

const MessageItem = React.memo(({ item, characterAvatar, colors, isDarkMode, animation }: MessageItemProps) => {
  const isUser = item.sender === 'user';
  const formattedTime = useMemo(() => new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), [item.timestamp]);

  // Removed audio playback logic
  const getAvatarSource = (avatar: Character['avatar']): ImageSourcePropType => {
      if (typeof avatar === 'number') return avatar;
      if (typeof avatar === 'string' && avatar.startsWith('http')) return { uri: avatar };
      // Add handling for local string paths if necessary, otherwise default
      return require('../assets/profile-placeholder.png'); // Default placeholder
  };

  const aiAvatarSource = useMemo(() => getAvatarSource(characterAvatar), [characterAvatar]);

  return (
    <Animated.View
      style={[
        styles.messageRow,
        isUser ? styles.userMessageRow : styles.aiMessageRow,
        {
          opacity: animation.fadeAnim,
          transform: [
            { translateY: animation.slideAnim },
            { scale: animation.scaleAnim }
          ]
        }
      ]}
    >
      {!isUser && (
        <View style={styles.messageAvatarContainer}>
          <Image
            source={aiAvatarSource}
            style={[styles.messageAvatar, { borderColor: colors.avatarBorder }]}
            onError={(e) => console.warn("AI avatar error:", e.nativeEvent.error)}
          />
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userMessageBubble : styles.aiMessageBubble,
          isUser
            ? { backgroundColor: colors.userBubble }
            : { backgroundColor: colors.aiBubble, borderColor: colors.border, borderWidth: isDarkMode ? 0 : 1 },
          { shadowColor: colors.aiBubbleShadow }
        ]}
      >
        {/* Removed image and audio display logic */}
        {/* Always display text content */}
        <Text style={[styles.messageText, { color: isUser ? colors.userText : colors.aiText }]}>
          {item.text}
        </Text>
        {/* Adjusted timestamp style reference */}
        <Text style={[styles.messageTimestamp, { color: isUser ? colors.userText : colors.messageTimestamp }]}>
           {formattedTime}
         </Text>
      </View>
      {isUser && <View style={styles.userAvatarPlaceholder} />}
    </Animated.View>
  );
});

const ChatInput = React.memo(({
  inputText,
  setInputText,
  handleSend,
  isAISpeaking,
  colors,
  sendButtonScale,
  handlePressInSend,
  handlePressOutSend,
  onMicPress, // Destructure the new prop
  onAttachPress, // Destructure the new prop
  stagedMedia, // Destructure staged media prop
  clearStagedMedia // Destructure clear function prop
}: ChatInputProps) => {
  const hasStagedMedia = stagedMedia !== null;
  const canSendText = inputText.trim().length > 0 && !isAISpeaking;
  const canSend = (canSendText || hasStagedMedia) && !isAISpeaking;

  return (
    <View style={[styles.inputAreaContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {/* Staged Media Indicator */}
      {hasStagedMedia && (
        <View style={styles.stagedMediaContainer}>
          <Text style={[styles.stagedMediaText, { color: colors.subText }]}>
            {stagedMedia.type === 'image' ? 'Image' : 'Audio'} ready
          </Text>
          <Pressable onPress={clearStagedMedia} style={styles.clearMediaButton}>
            <Ionicons name="close-circle" size={18} color={colors.subText} />
          </Pressable>
        </View>
      )}

      {/* Input Row */}
      <View style={styles.inputRow}>
      {/* Attachment Button */}
        <Pressable
          onPress={onAttachPress}
          disabled={isAISpeaking || hasStagedMedia} // Disable if AI is speaking or media staged
          style={({ pressed }: { pressed: boolean }) => [ // Typed 'pressed'
            styles.inputActionButton, // Generic style for side buttons
            (isAISpeaking || hasStagedMedia) && styles.sendButtonDisabled, // Reuse disabled style
            pressed && !(isAISpeaking || hasStagedMedia) && { opacity: 0.7 }
          ]}
        >
          <Ionicons name="attach" size={24} color={colors.subText} />
        </Pressable>

      <TextInput
        style={[
          styles.textInput,
          {
            backgroundColor: colors.inputBackground,
            color: colors.text,
            borderColor: colors.border,
          }
        ]}
        placeholder="Type a message..."
        placeholderTextColor={colors.subText}
        value={inputText}
        onChangeText={setInputText}
        multiline
        editable={!isAISpeaking} // Disable input while AI is speaking
      />

      {/* Microphone Button */}
      <Pressable
        onPress={onMicPress}
        disabled={isAISpeaking || hasStagedMedia} // Disable if AI is speaking or media staged
        style={({ pressed }: { pressed: boolean }) => [ // Typed 'pressed'
          styles.inputActionButton, // Generic style for side buttons
          (isAISpeaking || hasStagedMedia) && styles.sendButtonDisabled, // Reuse disabled style
          pressed && !(isAISpeaking || hasStagedMedia) && { opacity: 0.7 }
        ]}
      >
        <Ionicons name="mic" size={24} color={colors.subText} />
      </Pressable>

      {/* Send Button */}
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        onPressIn={handlePressInSend}
        onPressOut={handlePressOutSend}
        style={({ pressed }: { pressed: boolean }) => [ // Typed 'pressed'
          styles.sendButton,
          { backgroundColor: colors.sendButton },
          !canSend && styles.sendButtonDisabled,
          pressed && canSend && { opacity: 0.8 }
        ]}
      >
        <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
          <Ionicons name="send" size={20} color="#FFFFFF" />
        </Animated.View>
      </Pressable>
      </View>
    </View>
  );
});

const ChatHeader = React.memo(({ character, colors, handleBack, handleThemePress }: ChatHeaderProps) => {
    const getAvatarSource = (avatar: Character['avatar']): ImageSourcePropType => {
        if (typeof avatar === 'number') return avatar;
        if (typeof avatar === 'string' && avatar.startsWith('http')) return { uri: avatar };
        return require('../assets/profile-placeholder.png'); // Default placeholder
    };

    return (
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <Pressable onPress={handleBack} style={styles.headerButton}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            <View style={styles.headerCenter}>
                <Image
                    source={getAvatarSource(character.avatar)}
                    style={[styles.headerAvatar, { borderColor: colors.avatarBorder }]}
                    onError={(e) => console.warn("Header avatar error:", e.nativeEvent.error)}
                />
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                    {character.name}
                </Text>
            </View>
            <Pressable onPress={handleThemePress} style={styles.headerButton}>
                <Ionicons name="color-palette-outline" size={24} color={colors.text} />
            </Pressable>
        </View>
    );
});

const ThemeSelectorModal = React.memo(({ visible, onClose, themes, selectedTheme, onSelectTheme, colors }: ThemeSelectorModalProps) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Pressable style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Select Theme</Text>
                    <FlatList
                        data={themes}
                        keyExtractor={(item) => item.id}
                        numColumns={3} // Adjust number of columns as needed
                        renderItem={({ item }) => (
                            <Pressable
                                style={[
                                    styles.themePreviewContainer,
                                    item.id === selectedTheme.id && { borderColor: colors.themeSelectedBorder, borderWidth: 2 }
                                ]}
                                onPress={() => onSelectTheme(item)}
                            >
                                <ImageBackground
                                    source={item.background ?? undefined}
                                    style={[styles.themePreview, { backgroundColor: colors.background }]} // Use background color as fallback
                                    imageStyle={styles.themePreviewImage}
                                    resizeMode="cover"
                                >
                                    {/* Optional: Add a checkmark or indicator for selected theme */}
                                </ImageBackground>
                                <Text style={[styles.themeName, { color: colors.subText }]}>{item.name}</Text>
                            </Pressable>
                        )}
                        contentContainerStyle={styles.themeListContainer}
                    />
                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Text style={[styles.closeButtonText, { color: colors.closeButton }]}>Close</Text>
                    </Pressable>
                </Pressable>
            </Pressable>
        </Modal>
    );
});

const GuestModeBanner = React.memo(({ colors, onUpgradePress }: GuestModeBannerProps) => (
    <View style={[styles.guestBanner, { backgroundColor: colors.accent }]}>
        <Text style={[styles.guestBannerText, { color: colors.text }]}>Guest Mode: History not saved.</Text>
        <Pressable onPress={onUpgradePress}>
            <Text style={[styles.guestBannerLink, { color: colors.primary }]}>Login/Sign Up</Text>
        </Pressable>
    </View>
));


// --- Main Component ---

export default function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { character } = route.params;
  const { user } = useAuth();
  const { isDarkMode } = useContext(ThemeContext); // Removed 'theme' as it's not in the context value type
  const colors = useDynamicColors(isDarkMode);

  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  const [isThemeModalVisible, setIsThemeModalVisible] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ChatTheme>(CHAT_THEMES[0]); // Default theme
  const [stagedMedia, setStagedMedia] = useState<StagedMedia | null>(null); // State for staged media
  const [isPickingMedia, setIsPickingMedia] = useState(false); // Prevent concurrent media picks

  const flatListRef = useRef<FlatList>(null);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const messageAnimations = useRef<{ [key: string]: { fadeAnim: Animated.Value; slideAnim: Animated.Value; scaleAnim: Animated.Value } }>({}).current;
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null); // For recording timer
  const [recordingDuration, setRecordingDuration] = useState(0); // Recording duration state


  // --- Animation Handlers ---

  const animateButton = (toValue: number) => {
    Animated.spring(sendButtonScale, {
      toValue,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePressInSend = () => animateButton(0.9);
  const handlePressOutSend = () => animateButton(1);

  const getMessageAnimation = useCallback((messageId: string | number) => {
    const idStr = String(messageId);
    if (!messageAnimations[idStr]) {
      messageAnimations[idStr] = {
        fadeAnim: new Animated.Value(0),
        slideAnim: new Animated.Value(10),
        scaleAnim: new Animated.Value(0.95)
      };
      Animated.parallel([
        Animated.timing(messageAnimations[idStr].fadeAnim, {
          toValue: 1,
          duration: MESSAGE_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(messageAnimations[idStr].slideAnim, {
          toValue: 0,
          duration: MESSAGE_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(messageAnimations[idStr].scaleAnim, {
          toValue: 1,
          duration: MESSAGE_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }
    return messageAnimations[idStr];
  }, [messageAnimations]);


  // --- Utility Functions ---

  const scrollToBottom = useCallback(() => {
    // Use setTimeout to allow FlatList to update before scrolling
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100); // Adjust delay if needed
  }, []);


  // --- Data Fetching and Subscription ---

  useEffect(() => {
    const loadChat = async () => {
      setIsLoading(true);
      let initialMessages: UIMessage[] = [];

      if (user && user.id && character?.id) {
        // Logged-in user: Fetch from DB
        const dbMessages = await getChatMessages(user.id, character.id);
        initialMessages = dbMessages.map(mapDbMessageToUIMessage);
      } else if (character?.id) {
        // Guest user: Load from AsyncStorage (if implemented) or start fresh
        // For now, guests start fresh, but could load from guest session storage
        console.log("Guest mode: Starting new chat session.");
      }

      // Add welcome message if chat is empty
      if (initialMessages.length === 0 && character) {
        const welcomeText = generateWelcomeMessage(character);
        initialMessages.push({
          id: 'welcome-' + Crypto.randomUUID(),
          text: welcomeText,
          sender: 'ai',
          timestamp: Date.now(),
        });
      }

      // Reverse messages for FlatList inverted display (newest at bottom)
      setMessages(initialMessages.reverse());
      setIsLoading(false);
      scrollToBottom(); // Scroll after initial load
    };

    loadChat();

    // Set up real-time subscription if logged in
    if (user && user.id && character?.id) {
      const channel = subscribeToNewMessages(user.id, character.id, (newMessage) => {
        // Avoid adding duplicate messages if sender is the current user
        // (DB insert might trigger subscription before local state update finishes)
        if (newMessage.sender === 'user' && newMessage.user_id === user.id) {
          // Optional: Could potentially update the UI message ID if needed, but usually not necessary
          return;
        }
        // Add new AI messages received via subscription
        if (newMessage.sender === 'ai') {
            setMessages(prevMessages => [mapDbMessageToUIMessage(newMessage), ...prevMessages]);
            scrollToBottom();
        }
      });
      subscriptionRef.current = channel;
    }

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        unsubscribeFromChat(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      // Clear recording timer on unmount
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [user, character, scrollToBottom]); // Dependencies for loading and subscription


  // --- Theme Handling ---

  useEffect(() => {
    // Load saved theme preference from AsyncStorage or use default
    const loadTheme = async () => {
      try {
        const savedThemeId = await AsyncStorage.getItem(`chatTheme_${character?.id}`);
        const foundTheme = CHAT_THEMES.find(t => t.id === savedThemeId);
        if (foundTheme) {
          setSelectedTheme(foundTheme);
        }
      } catch (error) {
        console.error("Error loading chat theme:", error);
      }
    };
    if (character?.id) {
        loadTheme();
    }
  }, [character?.id]);

  const handleSelectTheme = useCallback(async (theme: ChatTheme) => {
    setSelectedTheme(theme);
    setIsThemeModalVisible(false);
    try {
      if (character?.id) {
        await AsyncStorage.setItem(`chatTheme_${character.id}`, theme.id);
      }
    } catch (error) {
      console.error("Error saving chat theme:", error);
    }
  }, [character?.id]);

  const handleThemePress = () => setIsThemeModalVisible(true);


  // --- Media Handling ---

  // Function to clear staged media
  const clearStagedMedia = useCallback(() => {
    setStagedMedia(null);
  }, []);

  // Function to handle picking media from library
  const handlePickMedia = useCallback(async () => {
    if (isPickingMedia) return;
    setIsPickingMedia(true);

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Media library permission is required to attach files.');
        setIsPickingMedia(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow images and videos initially
        allowsEditing: false,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // Determine if it's an image or audio (Expo AV might be needed for better audio type detection)
        // ImagePicker returns 'image' or 'video'. We'll treat 'video' as potential audio for now.
        const mediaType: 'image' | 'audio' = asset.type === 'image' ? 'image' : 'audio';
        const mimeType = asset.mimeType; // Get mimeType if available

        if (asset.base64) {
          // console.log(`Staging ${mediaType}: ${asset.uri.substring(0, 50)}...`);
          setStagedMedia({
            uri: asset.uri,
            base64: asset.base64,
            type: mediaType,
            mimeType: mimeType // Store mimeType
          });
          setInputText(''); // Clear text input when media is staged
        } else {
          Alert.alert('Error', 'Could not get base64 data for the selected file.');
        }
      }
    } catch (error) {
      console.error("Error picking media:", error);
      Alert.alert('Error', 'An error occurred while selecting media.');
    } finally {
      setIsPickingMedia(false); // Ensure loading state is reset
    }
  }, [isPickingMedia, setInputText]); // Add setInputText dependency

  // --- Audio Recording ---
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = useCallback(async () => {
    // Prevent starting if media is already staged
    if (stagedMedia) {
        Alert.alert("Media Staged", "Clear the current attachment before recording audio.");
        return;
    }
    try {
      console.log('Requesting permissions..');
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Microphone permission is required to record audio.');
        return;
      }
      console.log('Permissions granted.');

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording: newRecording } = await Audio.Recording.createAsync(
         Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
      console.log('Recording started');

      // Start duration timer
      setRecordingDuration(0);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Recording Error', 'Could not start audio recording.');
    }
  }, [stagedMedia]); // Add stagedMedia dependency

  const stopRecording = useCallback(async () => {
    if (!recording) return;

    console.log('Stopping recording..');
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setRecordingDuration(0); // Reset duration

    try {
      await recording.stopAndUnloadAsync();
      // await Audio.setAudioModeAsync({ allowsRecordingIOS: false }); // Reset mode after stopping
      const uri = recording.getURI();
      console.log('Recording stopped and stored at', uri);
      if (uri) {
        try {
          console.log('Reading audio file:', uri);
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          console.log('Audio Base64 generated (first 50 chars):', base64.substring(0, 50));
          // Determine mime type for audio recording (adjust if needed)
          const mimeType = Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mpeg'; // Common defaults
          setStagedMedia({ uri, base64, type: 'audio', mimeType });
          setInputText(''); // Clear text input when media is staged
        } catch (readError) {
          console.error('Error reading audio file:', readError);
          Alert.alert('Error', 'Failed to read recorded audio file.'); // Use Alert
        }
      } else {
        console.warn('Recording URI is null after stopping.');
        Alert.alert('Error', 'Could not get the recorded audio file.'); // Use Alert
      }
      setRecording(null); // Clear the recording object
    } catch (error) {
      console.error('Failed to stop or unload recording', error);
      Alert.alert('Error', 'There was an issue stopping the recording.'); // Use Alert
      setRecording(null); // Still try to clear the recording object
    }
  }, [recording, setInputText]); // Add setInputText dependency

  // Combined handler for the attach button
  const handleAttachPress = useCallback(() => {
      // Simple example: Just trigger media picking for now
      // Could later add options (Camera, Library, File)
      handlePickMedia();
  }, [handlePickMedia]);


  // --- Message Sending ---
  const handleSendMessage = useCallback(async () => {
    const trimmedInput = inputText.trim();
    const currentStagedMedia = stagedMedia; // Capture staged media at the time of sending

    // Prevent sending if nothing is staged/typed or AI is speaking
    if ((!trimmedInput && !currentStagedMedia) || isAISpeaking) return;

    Keyboard.dismiss();
    setIsAISpeaking(true); // Indicate AI is processing

    // Determine user message text for UI and DB
    let userMessageTextForDisplay = trimmedInput;
    if (!trimmedInput && currentStagedMedia) {
      userMessageTextForDisplay = `[Sent ${currentStagedMedia.type}]`; // Placeholder text
    } else if (trimmedInput && currentStagedMedia) {
      // Optional: Combine text and media placeholder if needed for UI clarity
      // userMessageTextForDisplay = `${trimmedInput} [Attached ${currentStagedMedia.type}]`;
      // Keep it simple for now, just use the text if provided
    }


    // Create user message object for UI
    const userMessageForUI: UIMessage = {
      id: Crypto.randomUUID(),
      text: userMessageTextForDisplay, // Use the determined text
      sender: 'user',
      timestamp: Date.now(),
      // Do not include image/audio URLs here as per instructions
    };

    // Add user message to UI immediately
    setMessages(prevMessages => [userMessageForUI, ...prevMessages].sort((a, b) => b.timestamp - a.timestamp)); // Keep sorted reverse-chronologically
    scrollToBottom();

    // User message saving is now handled by the Edge Function

    // Prepare chat history for AI (limit context size if needed)
    // Use the current UI messages state (reversed for chronological order for AI)
    const historyForAI = messages
      .slice(0, 10) // Take the 10 most recent UI messages
      .reverse() // Reverse to get chronological order
      .map(msg => ({
        // Explicitly cast the role to the expected type
        role: msg.sender === 'user' ? 'user' : ('assistant' as 'user' | 'assistant'),
        content: msg.text, // Use text content for history
      }));

    // Clear input fields AFTER initiating the call
    setInputText('');
    setStagedMedia(null); // Clear staged media

    // Call the Supabase Edge Function to handle AI processing and DB saving
    try {
      if (!character?.id) {
        throw new Error("Character ID is missing.");
      }

      // Prepare payload for the Edge Function
      const functionPayload = {
        prompt: trimmedInput,
        imageBase64: currentStagedMedia?.type === 'image' ? currentStagedMedia.base64 : undefined,
        audioBase64: currentStagedMedia?.type === 'audio' ? currentStagedMedia.base64 : undefined,
        mimeType: currentStagedMedia?.mimeType, // Pass mimeType
        userId: user?.id, // Pass user ID (can be null for guests)
        characterId: character.id,
        // Pass minimal chat history if needed by the function (optional, depends on function implementation)
        // chatHistory: historyForAI,
      };

      console.log('Invoking openrouter-proxy with payload:', {
          ...functionPayload,
          imageBase64: functionPayload.imageBase64 ? '...' : undefined, // Avoid logging full base64
          audioBase64: functionPayload.audioBase64 ? '...' : undefined,
      });

      const { data, error } = await supabase.functions.invoke('openrouter-proxy', {
        body: functionPayload,
      });

      if (error) {
        console.error('Supabase function invocation error:', error);
        // Add error message to UI
        addMessage({
          id: Crypto.randomUUID(),
          text: `Error communicating with AI: ${error.message || 'Unknown error'}`,
          sender: 'ai',
          timestamp: Date.now(),
        });
        throw new Error(`Function error: ${error.message}`);
      }

      console.log('Supabase function response:', data);

      // The Edge Function now handles saving both user and AI messages.
      // The AI response will arrive via the Realtime subscription.
      // We don't need to manually add the AI response to the UI here.

      // Update guest chat session if needed (using the AI response text if returned by function, or a placeholder)
      if (!user && character?.id) {
          // Assuming the function might return the AI text for guest mode update
          const aiResponseTextForGuest = data?.aiResponse ?? '[AI response]';
          await updateGuestChatSession(character.id, character.name, aiResponseTextForGuest);
      }

    } catch (error) {
      console.error('Error sending message via Edge Function:', error);
      Alert.alert('Error', `Failed to get response: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Optionally add a local error message to the chat UI
      const errorMessage: UIMessage = {
        id: Crypto.randomUUID(),
        text: "Sorry, I couldn't connect. Please try again.",
        sender: 'ai', // Display as an AI message for consistency
        timestamp: Date.now(),
      };
      setMessages(prevMessages => [errorMessage, ...prevMessages].sort((a, b) => b.timestamp - a.timestamp));
      scrollToBottom();
    } finally {
      setIsAISpeaking(false); // Ensure loading state is turned off
    }

  }, [inputText, stagedMedia, isAISpeaking, user, character, messages, setMessages, scrollToBottom, setStagedMedia, setInputText]); // Added dependencies


  // --- Render ---

  const renderItem = useCallback(({ item }: { item: UIMessage }) => (
    <MessageItem
      item={item}
      characterAvatar={character.avatar}
      colors={colors}
      isDarkMode={isDarkMode}
      animation={getMessageAnimation(item.id)}
    />
  ), [character.avatar, colors, isDarkMode, getMessageAnimation]); // Dependencies for memoization

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeAreaLoading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const backgroundSource = selectedTheme.background;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.card }]}>
      <ImageBackground
        source={backgroundSource ?? undefined} // Use undefined if null
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <ChatHeader
          character={character}
          colors={colors}
          handleBack={() => navigation.goBack()}
          handleThemePress={handleThemePress}
        />
        {!user && <GuestModeBanner colors={colors} onUpgradePress={() => navigation.navigate('Login')} />}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0} // Adjust offset as needed
        >
          <View style={styles.container}>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item) => String(item.id)}
              inverted // Shows latest messages at the bottom
              contentContainerStyle={styles.listContentContainer}
              style={{ flex: 1 }} // Ensure FlatList takes up space
              {...FLATLIST_OPTIMIZATION_PROPS}
              ListFooterComponent={isAISpeaking ? <TypingIndicatorDisplay character={character} colors={colors} /> : null}
              keyboardShouldPersistTaps="handled"
            />
            <ChatInput
              inputText={inputText}
              setInputText={setInputText}
              handleSend={handleSendMessage}
              isAISpeaking={isAISpeaking}
              colors={colors}
              sendButtonScale={sendButtonScale}
              handlePressInSend={handlePressInSend}
              handlePressOutSend={handlePressOutSend}
              onMicPress={isRecording ? stopRecording : startRecording} // Toggle recording
              onAttachPress={handleAttachPress} // Pass attach handler
              stagedMedia={stagedMedia} // Pass staged media state
              clearStagedMedia={clearStagedMedia} // Pass clear function
            />

            {/* Optional: Display recording status */}
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <Text style={{ color: 'red' }}>Recording: {recordingDuration}s</Text>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
      <ThemeSelectorModal
        visible={isThemeModalVisible}
        onClose={() => setIsThemeModalVisible(false)}
        themes={CHAT_THEMES}
        selectedTheme={selectedTheme}
        onSelectTheme={handleSelectTheme}
        colors={colors}
      />
    </SafeAreaView>
  );
}

// --- Styles ---
// TODO: Refactor styles into separate file or organize better

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  safeAreaLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    flex: 1,
  },
  container: {
    flex: 1,
    // backgroundColor: 'transparent', // Ensure container itself is transparent if using background image
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  listContentContainer: {
    paddingHorizontal: 10,
    paddingTop: 10, // Add padding to top
    paddingBottom: 5, // Add some padding at the bottom
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end', // Align items to the bottom
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  aiMessageRow: {
    justifyContent: 'flex-start',
  },
  messageAvatarContainer: {
    width: 36, // Fixed width for avatar container
    marginRight: 8,
    // No marginBottom needed if aligning items to flex-end
  },
  userAvatarPlaceholder: {
    width: 36, // Match AI avatar width
    marginLeft: 8,
  },
  messageAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  messageBubble: {
    maxWidth: '75%', // Max width for bubbles
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    elevation: 1, // Android shadow
    shadowOffset: { width: 0, height: 1 }, // iOS shadow
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  userMessageBubble: {
    borderBottomRightRadius: 4, // User bubble tail
  },
  aiMessageBubble: {
    borderBottomLeftRadius: 4, // AI bubble tail
    // Removed shadow color here, applied in component based on theme
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20, // Improve readability
  },
  messageTimestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end', // Position timestamp to the right
    opacity: 0.7,
  },
  inputAreaContainer: {
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 5, // Adjust padding for different platforms
    paddingTop: 5,
    paddingHorizontal: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center', // Align items vertically
    minHeight: 45, // Ensure a minimum height
  },
  textInput: {
    flex: 1,
    minHeight: 40, // Minimum height for the text input
    maxHeight: 120, // Limit the maximum height for multiline input
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10, // Adjust vertical padding
    fontSize: 15,
    marginHorizontal: 5, // Add some horizontal margin
  },
  inputActionButton: {
    padding: 8, // Add padding to increase tap area
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5, // Add margin to separate from mic button
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    height: 60, // Fixed header height
  },
  headerButton: {
    padding: 5, // Hit area for buttons
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Allow center to take up space
    justifyContent: 'center', // Center items horizontally
    marginHorizontal: 10, // Add margin around the center content
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    flexShrink: 1, // Allow title to shrink if needed
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  themeListContainer: {
    alignItems: 'center',
  },
  themePreviewContainer: {
    margin: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent', // Default transparent border
    borderRadius: 8,
    padding: 3,
  },
  themePreview: {
    width: 80,
    height: 120,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)', // Use theme color
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Clip the background image
  },
  themePreviewImage: {
      borderRadius: 6, // Apply border radius to the image itself
  },
  themeName: {
    marginTop: 5,
    fontSize: 12,
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  typingIndicatorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingVertical: 8,
      // backgroundColor: 'transparent', // Inherit from parent or set explicitly
  },
  typingIndicatorAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      marginRight: 8,
      borderWidth: 1,
  },
  typingIndicatorText: {
      fontSize: 13,
      marginRight: 4,
  },
  typingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 2, // Small space after "typing" text
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  guestBanner: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 15,
  },
  guestBannerText: {
      fontSize: 13,
      marginRight: 5,
  },
  guestBannerLink: {
      fontSize: 13,
      fontWeight: '600',
      textDecorationLine: 'underline',
  },
  stagedMediaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    // Use dynamic border color
    // borderBottomColor: colors.border, // Apply color dynamically where used
  },
  stagedMediaText: {
    fontSize: 13,
    marginRight: 5,
  },
  clearMediaButton: {
    padding: 2, // Small padding for tap area
  },
  recordingIndicator: {
    position: 'absolute',
    bottom: 60, // Adjust position as needed
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingVertical: 3,
  },
});
