import React, { useState, useEffect, useRef, useContext, useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native'; // Ensure single import
import { LogBox } from 'react-native';
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
// import { GiftedChat, IMessage } from 'react-native-gifted-chat'; // Removed - Using custom FlatList
import * as ImagePicker from 'expo-image-picker'; // Keep for image selection (input)
// import { Audio, Recording } from 'expo-av'; // Keep Recording for input, remove Audio for playback
import { Audio } from 'expo-av'; // Keep Audio for Recording permissions/instance
import * as FileSystem from 'expo-file-system'; // Import FileSystem
// import { Image as ExpoImage } from 'expo-image'; // Removed - No longer displaying images in messages
import { supabase } from '../utils/supabase'; // Import Supabase client
import { useAuth } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { v4 as uuidv4 } from 'uuid'; // Added for unique ID generation
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
  suggestedQuestions?: string[]; // Added for assistant suggested questions
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
  // navigation prop is removed, we use the hook
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
    id: dbMsg.id ?? Crypto.randomUUID(), // Use DB id if available, otherwise generate UUID
    text: dbMsg.content ?? '[empty message]', // Use content directly, default if null/undefined
    sender: (dbMsg.sender ?? 'ai') as 'user' | 'ai',
    timestamp: dbMsg.created_at ? new Date(dbMsg.created_at).getTime() : Date.now(),
    // image_url and audio_url are not present on the DB Message type, so omit them here.
    // The UIMessage type allows them to be optional.
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
          pressed && canSend && { opacity: 0.7 }
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

    const avatarSource = useMemo(() => getAvatarSource(character?.avatar), [character?.avatar]);

    return (
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <Pressable onPress={handleBack} style={styles.headerButton}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            <View style={styles.headerCenter}>
                <Image
                    source={avatarSource}
                    style={[styles.headerAvatar, { borderColor: colors.avatarBorder }]}
                    onError={(e) => console.warn("Header avatar error:", e.nativeEvent.error)}
                />
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                    {character?.name || 'Chat'}
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
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Select Chat Theme</Text>
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
                                    style={styles.themePreviewBackground}
                                    imageStyle={{ borderRadius: 8 }}
                                    resizeMode="cover"
                                >
                                    {!item.background && <View style={[styles.themePreviewDefault, { backgroundColor: colors.background }]} />}
                                </ImageBackground>
                                <Text style={[styles.themePreviewName, { color: colors.subText }]}>{item.name}</Text>
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
        <Text style={[styles.guestBannerText, { color: colors.text }]}>Guest Mode</Text>
        <Pressable onPress={onUpgradePress}>
            <Text style={[styles.guestBannerLink, { color: colors.primary }]}>Login/Sign Up</Text>
        </Pressable>
    </View>
));


// --- Main Component ---

export default function ChatScreen({ route }: ChatScreenProps) {
  const { character } = route.params;
  const navigation = useNavigation<NavigationProp>(); // Define navigation using the hook
  const {
    user,
    isGuest,
    isSubscribed, // Added
    freeMessageCount, // Added
    incrementGuestMessageCount,
    incrementFreeMessageCount, // Added
    shouldShowSubscriptionOffer,
    shouldShowDiscountOffer,
    markDiscountOfferShown,
    decrementCredits
  } = useAuth(); // Destructure new state/functions
  const { isDarkMode } = useContext(ThemeContext); // Removed 'theme' as it's not provided/used
  const colors = useDynamicColors(isDarkMode);

  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [stagedMedia, setStagedMedia] = useState<StagedMedia | null>(null); // State for staged media
  const [isRecording, setIsRecording] = useState(false);
  const recordingInstance = useRef<Audio.Recording | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const messageAnimations = useRef<{ [key: string]: { fadeAnim: Animated.Value; slideAnim: Animated.Value; scaleAnim: Animated.Value } }>({});
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ChatTheme>(CHAT_THEMES[0]); // Default theme

  // Animation for send button press
  useEffect(() => {
    // Ignore specific warnings if necessary (use sparingly)
    LogBox.ignoreLogs(['VirtualizedLists should never be nested']);
  }, []);

  const animateButton = (toValue: number) => {
    Animated.spring(sendButtonScale, {
      toValue,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  // Get or create animation values for a message
  const getMessageAnimation = useCallback((messageId: string | number) => {
    const key = String(messageId);
    if (!messageAnimations.current[key]) {
      messageAnimations.current[key] = {
        fadeAnim: new Animated.Value(0),
        slideAnim: new Animated.Value(10),
        scaleAnim: new Animated.Value(0.95)
      };
    }
    return messageAnimations.current[key];
  }, []);

  // Scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);


  // Load chat history and subscribe to new messages
  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let isMounted = true;

    const loadChat = async () => {
      setIsLoadingHistory(true);
      try {
        let initialMessages: UIMessage[] = [];
        if (user?.id && character?.id) {
          const dbMessages = await getChatMessages(user.id, character.id);
          initialMessages = dbMessages.map(mapDbMessageToUIMessage);

          // Subscribe to new messages for logged-in users
          channel = subscribeToNewMessages(user.id, character.id, (newMessage) => {
            if (isMounted) {
              const uiMessage = mapDbMessageToUIMessage(newMessage);
              // Prevent adding duplicate messages from subscription if already added optimistically
              setMessages(prevMessages => {
                  if (!prevMessages.some(msg => msg.id === uiMessage.id)) {
                      // Animate new incoming message
                      const anim = getMessageAnimation(uiMessage.id);
                      Animated.parallel([
                          Animated.timing(anim.fadeAnim, { toValue: 1, duration: MESSAGE_ANIMATION_DURATION, useNativeDriver: true }),
                          Animated.timing(anim.slideAnim, { toValue: 0, duration: MESSAGE_ANIMATION_DURATION, useNativeDriver: true }),
                          Animated.timing(anim.scaleAnim, { toValue: 1, duration: MESSAGE_ANIMATION_DURATION, useNativeDriver: true })
                      ]).start();
                      return [...prevMessages, uiMessage];
                  }
                  return prevMessages;
              });
              scrollToBottom();
            }
          });

        } else if (isGuest && character?.id) {
          // Load guest messages from AsyncStorage (if implementation exists)
          // For now, just add the welcome message for guests
          console.log("Guest mode: No history loaded, showing welcome message.");
        }

        // Add welcome message if history is empty
        if (initialMessages.length === 0 && character) {
          const welcomeText = generateWelcomeMessage(character);
          const welcomeMessage: UIMessage = {
            id: uuidv4(),
            text: welcomeText,
            sender: 'ai',
            timestamp: Date.now(),
          };
          initialMessages.push(welcomeMessage);
        }

        if (isMounted) {
          setMessages(initialMessages);
          // Animate initial messages loading
          initialMessages.forEach((msg, index) => {
              const anim = getMessageAnimation(msg.id);
              Animated.sequence([
                  Animated.delay(index * 50), // Stagger animation
                  Animated.parallel([
                      Animated.timing(anim.fadeAnim, { toValue: 1, duration: MESSAGE_ANIMATION_DURATION, useNativeDriver: true }),
                      Animated.timing(anim.slideAnim, { toValue: 0, duration: MESSAGE_ANIMATION_DURATION, useNativeDriver: true }),
                      Animated.timing(anim.scaleAnim, { toValue: 1, duration: MESSAGE_ANIMATION_DURATION, useNativeDriver: true })
                  ])
              ]).start();
          });
          scrollToBottom();
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
        Alert.alert("Error", "Could not load chat history.");
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      }
    };

    loadChat();

    // Cleanup function
    return () => {
      isMounted = false;
      if (channel && user?.id && character?.id) {
        unsubscribeFromChat(channel);
      }
    };
  }, [user?.id, character?.id, isGuest, getMessageAnimation, scrollToBottom]); // Dependencies

  // Load saved theme
  useEffect(() => {
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

  // Save selected theme
  const handleSelectTheme = useCallback(async (theme: ChatTheme) => {
    setSelectedTheme(theme);
    setThemeModalVisible(false);
    if (character?.id) {
        try {
            await AsyncStorage.setItem(`chatTheme_${character?.id}`, theme.id);
        } catch (error) {
            console.error("Error saving chat theme:", error);
        }
    }
  }, [character?.id]);


  // --- Media Handling Callbacks ---

  const handlePickMedia = useCallback(async () => {
    // Request permissions first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant permission to access photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Only images for now
        allowsEditing: false, // Optional: allow editing
        quality: 0.7, // Compress image slightly
        base64: true, // Request base64 data
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0].base64 && result.assets[0].uri) {
        setStagedMedia({
          uri: result.assets[0].uri,
          base64: result.assets[0].base64,
          type: 'image',
          mimeType: result.assets[0].mimeType ?? 'image/jpeg', // Default mimeType if needed
        });
        setInputText(''); // Clear text input when media is staged
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Could not select image.");
    }
  }, []);

  // --- Recording Callbacks ---

  const startRecording = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true, // Important for recording
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
         Audio.RecordingOptionsPresets.HIGH_QUALITY // Use a preset
      );
      recordingInstance.current = recording;
      setIsRecording(true);
      console.log('Recording started');

    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Could not start recording.');
      setIsRecording(false); // Ensure state is reset on error
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recordingInstance.current) return;

    console.log('Stopping recording..');
    setIsRecording(false); // Update state first
    try {
      await recordingInstance.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ // Reset audio mode after recording
          allowsRecordingIOS: false,
      });
      const uri = recordingInstance.current.getURI();
      console.log('Recording stopped and stored at', uri);
      if (uri) {
        // Read the file as base64
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setStagedMedia({
          uri: uri,
          base64: base64,
          type: 'audio',
          mimeType: 'audio/mp4', // Adjust based on preset/platform if needed
        });
        setInputText(''); // Clear text input
      }
      recordingInstance.current = null; // Clear the ref
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Could not stop recording.');
      recordingInstance.current = null; // Ensure ref is cleared on error too
    }
  }, []);

  const handleMicPress = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const handleAttachPress = useCallback(() => {
    // Simple implementation: only allow picking images for now
    handlePickMedia();
    // Future: Could show an action sheet to choose between image/audio/etc.
  }, [handlePickMedia]);

  const clearStagedMedia = useCallback(() => {
    setStagedMedia(null);
  }, []);

  // --- Send Message Logic ---

  const handleSendMessage = useCallback(async () => {
    // --- Free Message Limit Check ---
    if (user && !isSubscribed) { // Check if logged in and not subscribed
      if (freeMessageCount >= 3) { // Check if limit reached
        Alert.alert( // Show alert
          "Free Limit Reached",
          "You've used your 3 free messages. Please subscribe for unlimited chatting.", // Message
          [{ text: "OK", onPress: () => navigation.navigate('SubscriptionScreen', {}) }] // Navigate on OK
        );
        return; // Prevent sending message
      }
    }
    // --- End Free Message Limit Check ---

    const textToSend = inputText.trim();
    const mediaToSend = stagedMedia; // Capture staged media

    // Reset input and staged media immediately
    setInputText('');
    setStagedMedia(null);
    Keyboard.dismiss();

    if (!textToSend && !mediaToSend) return; // Don't send empty messages

    setIsAISpeaking(true); // Indicate AI is processing

    const newUserMessage: UIMessage = {
      id: uuidv4(),
      text: textToSend, // Include text even if media is present
      sender: 'user',
      timestamp: Date.now(),
      image_url: mediaToSend?.type === 'image' ? mediaToSend.uri : undefined,
      audio_url: mediaToSend?.type === 'audio' ? mediaToSend.uri : undefined,
    };

    // Optimistically add user message to UI
    setMessages(prev => [...prev, newUserMessage]);

    // --- Increment Free Message Count if applicable ---
    if (user && !isSubscribed) {
      // Increment count for non-subscribed users after sending a message within the limit
      await incrementFreeMessageCount();
    }
    // --- End Increment ---

    // Animate the new user message
    const userAnim = getMessageAnimation(newUserMessage.id);
    Animated.parallel([
        Animated.timing(userAnim.fadeAnim, { toValue: 1, duration: MESSAGE_ANIMATION_DURATION, useNativeDriver: true }),
        Animated.timing(userAnim.slideAnim, { toValue: 0, duration: MESSAGE_ANIMATION_DURATION, useNativeDriver: true }),
        Animated.timing(userAnim.scaleAnim, { toValue: 1, duration: MESSAGE_ANIMATION_DURATION, useNativeDriver: true })
    ]).start();

    scrollToBottom();

    // Prepare message history for AI (limit context window if needed)
    const messagesIncludingNewUser = [...messages, newUserMessage];
    const historyForAI: OpenRouterMessage[] = messagesIncludingNewUser
      .slice(-10) // Limit context window to last 10 messages (adjust as needed)
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text, // Send only text content for now
      }));

    // Add media content if present
    if (mediaToSend) {
        const userMessageContent: OpenRouterMessageContent = [];
        if (textToSend) {
            userMessageContent.push({ type: 'text', text: textToSend });
        }
        if (mediaToSend.type === 'image' && mediaToSend.mimeType) {
            userMessageContent.push({
                type: 'image_url',
                image_url: { url: `data:${mediaToSend.mimeType};base64,${mediaToSend.base64}` }
            });
        }
        // TODO: Add audio handling if OpenRouter model supports it via base64 data URI
        // else if (mediaToSend.type === 'audio' && mediaToSend.mimeType) { ... }

        // Replace the last message in historyForAI with the multi-content version
        if (historyForAI.length > 0 && historyForAI[historyForAI.length - 1].role === 'user') {
            historyForAI[historyForAI.length - 1].content = userMessageContent;
        } else {
            // Should not happen if we just added the user message, but handle defensively
            historyForAI.push({ role: 'user', content: userMessageContent });
        }
    }


    try {
      // Send message to DB (logged-in users only)
      if (user?.id && character?.id) {
        // Pass arguments individually as per function signature
        await sendMessageToDb(
          user.id,
          character.id,
          textToSend, // content can be null if media is present
          'user',
          mediaToSend?.type === 'image' ? mediaToSend.uri : null, // Pass image URI if applicable
          mediaToSend?.type === 'audio' ? mediaToSend.uri : null  // Pass audio URI if applicable
        );
      } else if (isGuest && character) {
        // Update guest chat session in AsyncStorage
        await updateGuestChatSession(character.id, character.name, textToSend || (mediaToSend?.type ?? 'Media'));
      }

      // Call the Supabase Edge Function for AI response
      const { data: aiResponseData, error: aiError } = await supabase.functions.invoke('openrouter-proxy', {
        body: {
          model: "openai/gpt-4o-mini", // Or make dynamic based on character/settings
          messages: historyForAI,
          characterId: character?.id,
          userId: user?.id ?? null,
        },
      });

      if (aiError) throw aiError;

      const aiTextResponse = aiResponseData?.choices?.[0]?.message?.content ?? 'Sorry, I could not process that.';

      const aiMessage: UIMessage = {
        id: uuidv4(),
        text: aiTextResponse,
        sender: 'ai',
        timestamp: Date.now(),
      };

      // Add AI message to DB (logged-in users only)
      if (user?.id && character?.id) {
        // Pass arguments individually
        await sendMessageToDb(
          user.id,
          character.id,
          aiMessage.text,
          'ai'
          // No media URLs for AI response currently
        );
      } else if (isGuest && character) {
         await updateGuestChatSession(character.id, character.name, aiMessage.text);
      }

      // Add AI message to UI (Subscription might add it, check if needed)
      // Check if message already added by subscription to prevent duplicates
      setMessages(previousMessages => {
          if (!previousMessages.some(msg => msg.id === aiMessage.id)) {
              // Animate new AI message
              const aiAnim = getMessageAnimation(aiMessage.id);
              Animated.parallel([
                  Animated.timing(aiAnim.fadeAnim, { toValue: 1, duration: MESSAGE_ANIMATION_DURATION, useNativeDriver: true }),
                  Animated.timing(aiAnim.slideAnim, { toValue: 0, duration: MESSAGE_ANIMATION_DURATION, useNativeDriver: true }),
                  Animated.timing(aiAnim.scaleAnim, { toValue: 1, duration: MESSAGE_ANIMATION_DURATION, useNativeDriver: true })
              ]).start();
              return [...previousMessages, aiMessage];
          }
          return previousMessages; // Already added by subscription
      });


    } catch (error: any) {
      console.error("Error sending message or getting AI response:", error);
      const errorMessage = error.message || "An error occurred.";
      // Add error message to UI
      const errorUIMessage: UIMessage = {
        id: uuidv4(),
        text: `Error: ${errorMessage}`,
        sender: 'ai', // Display as an AI message
        timestamp: Date.now(),
      };
      setMessages(currentMessages => [...currentMessages, errorUIMessage]);
      // Animate error message
      const errorAnim = getMessageAnimation(errorUIMessage.id);
      Animated.parallel([
          Animated.timing(errorAnim.fadeAnim, { toValue: 1, duration: MESSAGE_ANIMATION_DURATION, useNativeDriver: true }),
          Animated.timing(errorAnim.slideAnim, { toValue: 0, duration: MESSAGE_ANIMATION_DURATION, useNativeDriver: true }),
          Animated.timing(errorAnim.scaleAnim, { toValue: 1, duration: MESSAGE_ANIMATION_DURATION, useNativeDriver: true })
      ]).start();
    } finally {
      setIsAISpeaking(false);
      scrollToBottom();
    }
  }, [
      inputText,
      stagedMedia,
      messages,
      user,
      isGuest,
      isSubscribed, // Added
      freeMessageCount, // Added
      character,
      supabase,
      scrollToBottom,
      getMessageAnimation,
      incrementFreeMessageCount, // Added
      navigation // Added navigation dependency
    ]);


  // --- Render Logic ---

  const renderItem = useCallback(({ item }: { item: UIMessage }) => (
    <MessageItem
      item={item}
      characterAvatar={character?.avatar}
      colors={colors}
      isDarkMode={isDarkMode}
      animation={getMessageAnimation(item.id)}
    />
  ), [character?.avatar, colors, isDarkMode, getMessageAnimation]); // Added getMessageAnimation dependency

  // Memoize background source
  const backgroundSource = useMemo(() => {
    return selectedTheme.background ? selectedTheme.background : undefined;
  }, [selectedTheme]);

  // Handle send button animation
  const handlePressInSend = () => animateButton(0.8);
  const handlePressOutSend = () => animateButton(1);

  // Effect to show subscription/discount offers for guests
  useEffect(() => {
    if (isGuest) {
      shouldShowSubscriptionOffer().then(show => {
        if (show) {
          // Navigate to SubscriptionScreen or show a modal
          // Example: navigation.navigate('SubscriptionOfferScreen');
          console.log("Guest should see subscription offer now.");
          // Alert.alert("Free Limit Reached", "Sign up or log in for more messages!");
          // Consider a less intrusive way like a banner or modal
        }
      });
      // Discount offer logic (currently minimal)
      shouldShowDiscountOffer().then(show => {
        if (show) {
          console.log("Guest might see a discount offer (logic needs review).");
          // Example: navigation.navigate('DiscountOfferScreen', { fromCharacter: true });
          // markDiscountOfferShown(); // Mark as shown if needed
        }
      });
    }
  }, [isGuest, messages.length, shouldShowSubscriptionOffer, shouldShowDiscountOffer, markDiscountOfferShown, navigation]); // Added navigation dependency


  // --- JSX ---

  if (!character) {
    // Handle case where character data is missing (e.g., navigation error)
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.card }]}>
        <View style={styles.container}>
          <Text style={{ color: colors.text }}>Character data not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.card }]}>
      <ImageBackground
        source={backgroundSource}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <ChatHeader
          character={character}
          colors={colors}
          handleBack={() => navigation.goBack()} // Use navigation constant from hook
          handleThemePress={() => setThemeModalVisible(true)}
        />
        {/* Use navigation constant from hook for GuestModeBanner */}
        {isGuest && <GuestModeBanner colors={colors} onUpgradePress={() => navigation.navigate('Login')} />}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flexGrow}
          keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0} // Adjust offset as needed
        >
          <View style={styles.container}>
            {/* Suggested/Example Questions Row */}
            {(() => {
              const questions = character.suggestedQuestions ?? character.exampleQuestions ?? [];
              return questions.length > 0 ? (
                <View style={{ marginTop: 8, marginBottom: 4 }}>
                  <FlatList
                    data={questions}
                    horizontal
                    keyExtractor={(item, idx) => `${item}-${idx}`}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 8 }}
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => setInputText(item)}
                        style={({ pressed }) => [
                          {
                            backgroundColor: colors.inputBackground,
                            borderColor: colors.primary,
                            borderWidth: 1,
                            borderRadius: 18,
                            paddingVertical: 8,
                            paddingHorizontal: 14,
                            marginRight: 8,
                            opacity: pressed ? 0.7 : 1,
                          },
                        ]}
                      >
                        <Text style={{ color: colors.primary, fontSize: 15 }}>{item}</Text>
                      </Pressable>
                    )}
                  />
                </View>
              ) : null;
            })()}
            {isLoadingHistory ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loadingIndicator} />
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.listContentContainer}
                onContentSizeChange={scrollToBottom}
                onLayout={scrollToBottom}
                ListFooterComponent={isAISpeaking ? <TypingIndicatorDisplay character={character} colors={colors} /> : null}
                {...FLATLIST_OPTIMIZATION_PROPS} // Apply optimization props
              />
            )}
            <ChatInput
              inputText={inputText}
              setInputText={setInputText}
              handleSend={handleSendMessage}
              isAISpeaking={isAISpeaking}
              colors={colors}
              sendButtonScale={sendButtonScale}
              handlePressInSend={handlePressInSend}
              handlePressOutSend={handlePressOutSend}
              onMicPress={handleMicPress}
              onAttachPress={handleAttachPress}
              stagedMedia={stagedMedia}
              clearStagedMedia={clearStagedMedia}
            />
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
      <ThemeSelectorModal
        visible={themeModalVisible}
        onClose={() => setThemeModalVisible(false)}
        themes={CHAT_THEMES}
        selectedTheme={selectedTheme}
        onSelectTheme={handleSelectTheme}
        colors={colors}
      />
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
  },
  container: {
    flex: 1,
    // Removed background color - handled by SafeAreaView or ImageBackground
  },
  flexGrow: {
    flex: 1,
  },
  listContentContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
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
    // No marginBottom needed if row aligns items to flex-end
  },
  userAvatarPlaceholder: {
    width: 36, // Match AI avatar container width
    marginLeft: 8,
  },
  messageAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1, // Keep border for visibility
  },
  messageBubble: {
    maxWidth: '75%', // Limit bubble width
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    // Common shadow for AI bubbles (adjust as needed)
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessageBubble: {
    borderBottomRightRadius: 4, // User bubble tail
  },
  aiMessageBubble: {
    borderBottomLeftRadius: 4, // AI bubble tail
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22, // Improve readability
  },
  messageTimestamp: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right', // Align timestamp to the right within the bubble
    opacity: 0.7,
  },
  inputAreaContainer: {
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10, // More padding for iOS home indicator area
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center', // Align items vertically
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 10 : 8, // Adjust padding top for different platforms
    paddingBottom: Platform.OS === 'ios' ? 10 : 8, // Adjust padding bottom
    fontSize: 16,
    maxHeight: 100, // Limit input height
    marginHorizontal: 8, // Add horizontal margin
  },
  inputActionButton: {
    padding: 8, // Make touch target larger
  },
  sendButton: {
    marginLeft: 8, // Space between input and send button
    padding: 10,
    borderRadius: 20, // Make it circular
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Typing Indicator Styles
  typingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  typingIndicatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
  },
  typingIndicatorText: {
    fontSize: 14,
    marginRight: 4,
  },
  typingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 30, // Fixed width for the dots area
    height: 15, // Fixed height
    marginLeft: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    height: 60, // Standard header height
  },
  headerButton: {
    padding: 5, // Touch area for buttons
  },
  headerCenter: {
    flex: 1, // Allow center to take up space
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center items horizontally
    marginHorizontal: 10, // Space between buttons and center content
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
  // Theme Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center', // Center content inside modal
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  themeListContainer: {
    alignItems: 'center', // Center items in the list
  },
  themePreviewContainer: {
    margin: 10,
    alignItems: 'center',
    borderRadius: 10, // Apply border radius to container
    borderWidth: 1,
    borderColor: 'transparent', // Default transparent border
    padding: 5,
  },
  themePreviewBackground: {
    width: 70,
    height: 100,
    borderRadius: 8, // Match container border radius
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Ensure background respects border radius
    marginBottom: 5,
  },
  themePreviewDefault: {
    width: '100%',
    height: '100%',
  },
  themePreviewName: {
    fontSize: 12,
    marginTop: 4,
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Guest Mode Banner Styles
  guestBanner: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestBannerText: {
    fontSize: 14,
    marginRight: 10,
  },
  guestBannerLink: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // Staged Media Styles
  stagedMediaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1, // Separator line
    borderBottomColor: '#E2E8F0', // Use theme border color?
    marginBottom: 5,
  },
  stagedMediaText: {
    flex: 1,
    fontSize: 13,
    fontStyle: 'italic',
  },
  clearMediaButton: {
    marginLeft: 10,
    padding: 5,
  },
});
