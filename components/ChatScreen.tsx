import React, { useState, useEffect, useRef, useContext, useCallback, useMemo } from 'react';
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
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{character?.name || 'Chat'}</Text>
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
                        numColumns={2} // Display themes in two columns
                        contentContainerStyle={styles.themeListContainer}
                        renderItem={({ item }) => (
                            <Pressable
                                style={[
                                    styles.themeItem,
                                    { borderColor: item.id === selectedTheme.id ? colors.themeSelectedBorder : colors.themePreviewBorder }
                                ]}
                                onPress={() => onSelectTheme(item)}
                            >
                                <ImageBackground
                                    source={item.background ?? undefined}
                                    style={styles.themePreview}
                                    imageStyle={styles.themePreviewImage}
                                    resizeMode="cover"
                                >
                                    {!item.background && <View style={[styles.defaultThemePreview, { backgroundColor: colors.background }]} />}
                                </ImageBackground>
                                <Text style={[styles.themeName, { color: colors.subText }]}>{item.name}</Text>
                            </Pressable>
                        )}
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
        <Text style={[styles.guestBannerText, { color: colors.text }]}>Guest Mode: History is local only.</Text>
        <Pressable onPress={onUpgradePress}>
            <Text style={[styles.guestBannerLink, { color: colors.primary }]}>Login/Sign Up</Text>
        </Pressable>
    </View>
));


// --- Main Component ---
export default function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { character } = route.params;
  const { user } = useAuth(); // Get user context AT TOP LEVEL
  const { isDarkMode } = useContext(ThemeContext); // Get theme context (Removed unused appTheme)
  const colors = useDynamicColors(isDarkMode); // Get dynamic colors

  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  const [stagedMedia, setStagedMedia] = useState<StagedMedia | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isThemeModalVisible, setIsThemeModalVisible] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ChatTheme>(CHAT_THEMES[0]); // Default theme

  const flatListRef = useRef<FlatList>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageAnimations = useRef<{ [key: string]: { fadeAnim: Animated.Value; slideAnim: Animated.Value; scaleAnim: Animated.Value } }>({}).current;
  const sendButtonScale = useRef(new Animated.Value(1)).current;

  // Initial welcome message effect
  useEffect(() => {
    if (character && messages.length === 0 && !isLoading) { // Only add if messages are empty and not loading
      const welcomeText = generateWelcomeMessage(character);
      const welcomeMessage: UIMessage = {
        id: 'welcome-' + character.id,
        text: welcomeText,
        sender: 'ai',
        timestamp: Date.now() - 1000, // Slightly before load time
      };
      setMessages([welcomeMessage]); // Prepend welcome message
    }
  }, [character, messages.length, isLoading]); // Depend on messages.length and isLoading


  // Animation handlers
  const animateButton = (toValue: number) => {
    Animated.spring(sendButtonScale, {
      toValue,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };
  const handlePressInSend = () => animateButton(0.9);
  const handlePressOutSend = () => animateButton(1);

  // Get or create animation values for a message
  const getMessageAnimation = useCallback((messageId: string | number) => {
    const key = String(messageId);
    if (!messageAnimations[key]) {
      messageAnimations[key] = {
        fadeAnim: new Animated.Value(0),
        slideAnim: new Animated.Value(10),
        scaleAnim: new Animated.Value(0.95)
      };
      Animated.parallel([
        Animated.timing(messageAnimations[key].fadeAnim, {
          toValue: 1,
          duration: MESSAGE_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(messageAnimations[key].slideAnim, {
          toValue: 0,
          duration: MESSAGE_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(messageAnimations[key].scaleAnim, {
          toValue: 1,
          duration: MESSAGE_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }
    return messageAnimations[key];
  }, [messageAnimations]); // messageAnimations is stable

  // Scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    // Use setTimeout to ensure FlatList has updated
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
    }, 100); // Small delay
  }, []);


  // Load initial messages and subscribe to realtime updates
  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    const loadChat = async () => {
      setIsLoading(true);
      try {
        if (user?.id && character?.id) {
          // Logged-in user: Fetch from DB
          const dbMessages = await getChatMessages(user.id, character.id);
          const uiMessages = dbMessages.map(mapDbMessageToUIMessage);
          setMessages(uiMessages);
        } else if (character?.id) {
          console.log('CHAT_SCREEN [Guest Load]: Loading messages for guest.');
          // Guest user: Load from AsyncStorage
          const storageKey = `guest_conversation_${character.id}`;
          console.log(`CHAT_SCREEN [Guest Load]: Using storage key: ${storageKey}`);
          const storedMessagesRaw = await AsyncStorage.getItem(storageKey);
          console.log(`CHAT_SCREEN [Guest Load]: Raw data from AsyncStorage:`, storedMessagesRaw);
          if (storedMessagesRaw) {
            try {
              const storedMessages: UIMessage[] = JSON.parse(storedMessagesRaw);
              // console.log(`CHAT_SCREEN [Guest Load]: Parsed messages from AsyncStorage:`, JSON.stringify(storedMessages, null, 2)); // Keep commented unless needed
              // Basic validation
              if (Array.isArray(storedMessages)) {
                // Ensure messages have necessary fields (simple check)
                const validMessages = storedMessages.filter(m => m && m.id && m.text && m.sender && m.timestamp);
                setMessages(validMessages);
              } else {
                 console.warn(`CHAT_SCREEN [Guest Load]: Invalid data format in AsyncStorage for key ${storageKey}. Expected array.`);
                 setMessages([]); // Reset to empty if data is invalid
              }
            } catch (parseError) {
              console.error(`CHAT_SCREEN [Guest Load]: Error parsing guest messages from AsyncStorage for key ${storageKey}:`, parseError);
              setMessages([]); // Reset on parse error
            }
          } else {
            setMessages([]); // No stored messages, start empty
          }
        } else {
          console.warn("CHAT_SCREEN: Cannot load chat - missing user ID or character ID.");
          setMessages([]); // Ensure messages are empty if IDs are missing
        }
      } catch (error) {
        console.error("CHAT_SCREEN: Error loading chat messages:", error);
        Alert.alert("Error", "Could not load chat history.");
        setMessages([]); // Reset on error
      } finally {
        setIsLoading(false);
      }

      // Subscribe to realtime updates only for logged-in users
      if (user?.id && character?.id) {
        channel = subscribeToNewMessages(user.id, character.id, (newMessage) => {
          console.log('Realtime message received:', newMessage);
          const uiMessage = mapDbMessageToUIMessage(newMessage);
          // Use functional update to avoid race conditions and ensure correct order
          setMessages(prevMessages => {
            // Check if message already exists (by DB ID if available)
            if (prevMessages.some(msg => msg.id === uiMessage.id)) {
              return prevMessages; // Already exists, don't add again
            }
            // Assuming inverted list, add new message to the beginning
            return [uiMessage, ...prevMessages];
          });
          scrollToBottom(); // Scroll when new message arrives
        });
        console.log('Subscribed to realtime channel:', channel);
      }
    };

    if (character?.id) { // Only load if character exists
        loadChat();
    } else {
        console.error("CHAT_SCREEN: Character data is missing, cannot load chat.");
        setIsLoading(false); // Stop loading if no character
        setMessages([]);
    }

    // Cleanup function
    return () => {
      if (channel) {
        console.log('Unsubscribing from channel:', channel);
        unsubscribeFromChat(channel);
      }
    };
  }, [user?.id, character?.id, scrollToBottom]); // Re-run if user or character changes

  // Load selected theme from AsyncStorage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedThemeId = await AsyncStorage.getItem(`chat_theme_${character.id}`);
        if (savedThemeId) {
          const foundTheme = CHAT_THEMES.find(t => t.id === savedThemeId);
          if (foundTheme) {
            setSelectedTheme(foundTheme);
          }
        }
      } catch (error) {
        console.error("Error loading chat theme:", error);
      }
    };
    if (character?.id) {
        loadTheme();
    }
  }, [character?.id]);

  // Handle theme selection and save
  const handleSelectTheme = useCallback(async (theme: ChatTheme) => {
    setSelectedTheme(theme);
    setIsThemeModalVisible(false);
    try {
      await AsyncStorage.setItem(`chat_theme_${character.id}`, theme.id);
    } catch (error) {
      console.error("Error saving chat theme:", error);
      Alert.alert("Error", "Could not save theme preference.");
    }
  }, [character?.id]);

  const handleThemePress = () => setIsThemeModalVisible(true);

  // --- Media Handling ---

  const clearStagedMedia = () => setStagedMedia(null);

  // Request permissions and pick image/video
  const handlePickMedia = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Allow only images for now
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7, // Reduce quality slightly for faster uploads
        base64: true, // Request base64 encoding
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64 && asset.uri) {
          setStagedMedia({
            uri: asset.uri,
            base64: asset.base64,
            type: 'image', // Hardcoded as image for now
            mimeType: asset.mimeType ?? 'image/jpeg', // Get mimeType if available
          });
          setInputText(''); // Clear text input when media is staged
        } else {
          console.warn("ImagePicker result missing base64 or uri:", asset);
          Alert.alert("Error", "Could not process the selected image.");
        }
      }
    } catch (error) {
        console.error("Error picking media:", error);
        Alert.alert("Error", "An error occurred while selecting media.");
    }
  }, []);


  // --- Audio Recording ---

  const startRecording = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone permission is needed for audio recording.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording: newRecording } = await Audio.Recording.createAsync(
         Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setRecordingDuration(0); // Reset duration
      console.log('Recording started');

      // Start timer to update duration
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert("Recording Error", "Could not start audio recording.");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    console.log('Stopping recording..');
    if (!recording) return;

    // Clear timer
    if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
    }

    try {
        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false }); // Reset audio mode
        const uri = recording.getURI();
        console.log('Recording stopped and stored at', uri);

        if (uri) {
            // Read the file and convert to base64
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            setStagedMedia({
                uri: uri,
                base64: base64,
                type: 'audio',
                mimeType: 'audio/mp4', // Adjust if using a different format
            });
            setInputText(''); // Clear text input
        }
    } catch (error) {
        console.error('Failed to stop recording or process audio', error);
        Alert.alert("Recording Error", "Could not stop or process the audio recording.");
    } finally {
        setRecording(null); // Clear recording object
        setRecordingDuration(0); // Reset duration display
    }
  }, [recording]);

  const handleMicPress = useCallback(() => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [recording, startRecording, stopRecording]);

  const handleAttachPress = useCallback(() => {
    // Simple alert to choose media type for now
    Alert.alert(
      "Attach Media",
      "Choose media type to attach:",
      [
        { text: "Image", onPress: handlePickMedia },
        // { text: "Audio", onPress: () => console.log("Audio attach TBD") }, // Placeholder
        { text: "Cancel", style: "cancel" }
      ]
    );
  }, [handlePickMedia]);


  // --- Send Message Logic ---
  const handleSendMessage = useCallback(async () => {
    // Use the 'user' from the component scope, not from calling useAuth() again
    const isGuest = !user?.id;
    console.log(`CHAT_SCREEN [handleSendMessage]: Function called! isGuest: ${isGuest}`);

    const textToSend = inputText.trim();
    const mediaToSend = stagedMedia; // Capture staged media
    console.log(`CHAT_SCREEN [handleSendMessage]: textToSend = "${textToSend}"`); // Keep this log
    console.log(`CHAT_SCREEN [handleSendMessage]: mediaToSend =`, mediaToSend); // Keep this log

    // Reset input and staged media immediately
    setInputText('');
    setStagedMedia(null);
    Keyboard.dismiss(); // Dismiss keyboard on send

    if (!textToSend && !mediaToSend) {
      console.log("CHAT_SCREEN [handleSendMessage]: Attempted to send empty message. Exiting.");
      return; // Don't send empty messages
    }

    // --- Create User Message for UI ---
    const userMessage: UIMessage = {
      id: uuidv4(), // Generate unique ID for UI message
      text: textToSend,
      sender: 'user',
      timestamp: Date.now(),
      image_url: mediaToSend?.type === 'image' ? mediaToSend.uri : undefined,
      audio_url: mediaToSend?.type === 'audio' ? mediaToSend.uri : undefined,
    };
    console.log(`CHAT_SCREEN [handleSendMessage]: Created user message for UI:`, userMessage);

    // Add user message to UI immediately
    // Use functional update and add to the beginning (since list is inverted)
    setMessages(prev => {
        console.log(`CHAT_SCREEN [handleSendMessage setMessages User]: Adding user message to state. Prev count: ${prev.length}`);
        const newMessages = [userMessage, ...prev];
        console.log(`CHAT_SCREEN [handleSendMessage setMessages User]: New count: ${newMessages.length}`);
        return newMessages;
    });
    scrollToBottom(); // Scroll after adding user message

    // --- Prepare data for AI/DB ---
    setIsAISpeaking(true); // Indicate AI is processing

    // FIX: Construct history based on the state *after* adding the user message
    const messagesIncludingNewUser = [userMessage, ...messages]; // Manually create the array as it should be after the state update
    const historyForAI = messagesIncludingNewUser
      .slice(1, 11) // Slice from index 1 to exclude the current message, take up to 10 previous
      .filter(msg => msg.text)
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      }))
      .reverse(); // Reverse to get chronological order

    console.log(`CHAT_SCREEN [handleSendMessage]: History for AI (excluding current):`, JSON.stringify(historyForAI, null, 2));


    // Construct the current user message content for the AI
    let currentUserContent: OpenRouterMessageContent = [];
    if (textToSend) {
      currentUserContent.push({ type: 'text', text: textToSend });
    }
    if (mediaToSend?.type === 'image' && mediaToSend.base64) {
      currentUserContent.push({
        type: 'image_url',
        image_url: { url: `data:${mediaToSend.mimeType ?? 'image/jpeg'};base64,${mediaToSend.base64}` }
      });
    }
    // Note: Sending audio base64 directly might not be supported by all models.
    // This might need adjustment based on the specific AI model's capabilities.
    // if (mediaToSend?.type === 'audio' && mediaToSend.base64) {
    //   // How to represent audio depends on the model. Placeholder:
    //   currentUserContent.push({ type: 'text', text: `[User sent audio: ${mediaToSend.mimeType ?? 'audio/mp4'}]` });
    // }

    // If only text was sent, simplify content structure
    if (currentUserContent.length === 1 && currentUserContent[0].type === 'text') {
      currentUserContent = currentUserContent[0].text;
    } else if (currentUserContent.length === 0) {
        console.warn("handleSendMessage: No content to send to AI.");
        setIsAISpeaking(false);
        return; // Should not happen if check at start works, but safeguard
    }

    const messagesForFunction = [
        ...historyForAI,
        { role: 'user', content: currentUserContent } // Add the current message separately
    ];
    console.log(`CHAT_SCREEN [handleSendMessage]: Complete messagesForFunction:`, JSON.stringify(messagesForFunction, null, 2)); // Log the final payload


    try {
      if (user?.id && character?.id) {
        // --- Logged-in User Logic ---
        console.log(`CHAT_SCREEN [handleSendMessage LoggedIn]: Sending message to DB...`);
        // Send message to DB (which triggers Edge Function via hook/trigger)
        // Corrected arguments for sendMessageToDb: userId, characterId, content, sender, imageUrl, audioUrl
        await sendMessageToDb(user.id, character.id, textToSend, 'user', mediaToSend?.type === 'image' ? mediaToSend.uri : undefined, mediaToSend?.type === 'audio' ? mediaToSend.uri : undefined);
        console.log(`CHAT_SCREEN [handleSendMessage LoggedIn]: Message sent to DB. Waiting for realtime response.`);
        // Realtime subscription will handle adding the AI message to the UI
        setIsAISpeaking(false); // Let realtime handle AI message display
      } else if (character?.id) {
        // --- Guest User Logic ---
        console.log(`CHAT_SCREEN [handleSendMessage Guest]: Calling Edge Function 'openrouter-proxy'...`);
        // Call the Edge Function directly
        const { data, error } = await supabase.functions.invoke('openrouter-proxy', {
          body: JSON.stringify({
            model: "openai/gpt-4o-mini", // Or fetch dynamically
            messages: messagesForFunction, // Use the corrected history + current message
            characterId: character.id, // Pass character ID for context/logging
            // No userId for guests
          }),
        });
        console.log(`CHAT_SCREEN [handleSendMessage Guest]: Edge Function response - data:`, JSON.stringify(data, null, 2));
        console.log(`CHAT_SCREEN [handleSendMessage Guest]: Edge Function response - error:`, error);

        setIsAISpeaking(false); // AI finished

        if (error) {
          console.error("CHAT_SCREEN [Guest Send Error]: Edge function error:", error);
          Alert.alert("AI Error", `Could not get response: ${error.message}`);
          // Optionally add an error message to the chat UI
          setMessages(prev => [{ id: uuidv4(), text: `Error: ${error.message}`, sender: 'ai', timestamp: Date.now() }, ...prev]);
          return;
        }

        if (!data?.message) {
            console.error("CHAT_SCREEN [Guest Send Error]: No message content in Edge function response:", data);
            Alert.alert("AI Error", "Received an empty response from the AI.");
            setMessages(prev => [{ id: uuidv4(), text: "[AI response was empty]", sender: 'ai', timestamp: Date.now() }, ...prev]);
            return;
        }

        // --- Guest User Specific Logic ---
        // Use the component-scoped 'user' here too
        if (!user?.id && data?.message) { // Check for guest and message existence
          console.log(`CHAT_SCREEN [handleSendMessage Guest]: AI response received: "${data.message}"`);
          const newAiMessageForUI: UIMessage = {
            id: Crypto.randomUUID(),
            text: data.message, // Use the message from the response
            sender: 'ai',
            timestamp: Date.now(),
          };
          console.log(`CHAT_SCREEN [handleSendMessage Guest]: Created new AI message for UI:`, JSON.stringify(newAiMessageForUI, null, 2));
          setMessages(previousMessages => {
              console.log(`CHAT_SCREEN [handleSendMessage Guest setMessages]: Previous messages count: ${previousMessages.length}`);
              // Ensure we don't add duplicates if the message somehow got added already
              if (previousMessages.some(msg => msg.id === newAiMessageForUI.id)) {
                  console.log(`CHAT_SCREEN [handleSendMessage Guest setMessages]: Duplicate AI message detected (ID: ${newAiMessageForUI.id}), not adding.`);
                  return previousMessages;
              }
              // IMPORTANT: Assuming FlatList inverted={true}, new messages should be added to the START
              const newMessages = [newAiMessageForUI, ...previousMessages];
              console.log(`CHAT_SCREEN [handleSendMessage Guest setMessages]: New messages count: ${newMessages.length}`);
              return newMessages;
          });
          // Save updated messages to AsyncStorage *after* state update (using a separate useEffect might be safer)
          try {
            const storageKey = `guest_conversation_${character.id}`;
            console.log(`CHAT_SCREEN [handleSendMessage Guest Save]: Attempting to save to AsyncStorage. Key: ${storageKey}`);
            // Get the latest state by using the functional update pattern's result conceptually
            let finalMessagesToSave: UIMessage[] = [];
            setMessages(currentMessages => {
                finalMessagesToSave = currentMessages; // Capture the *actual* latest state
                return currentMessages; // No change needed here, just capturing
            });
            // Now use finalMessagesToSave which should be the most up-to-date
            const messagesToSaveString = JSON.stringify(finalMessagesToSave);
            console.log(`CHAT_SCREEN [handleSendMessage Guest Save]: Stringified messages being saved (length: ${messagesToSaveString.length}):`, messagesToSaveString.substring(0, 500) + '...');
            await AsyncStorage.setItem(storageKey, messagesToSaveString);
            console.log(`CHAT_SCREEN [handleSendMessage Guest Save]: Successfully saved to AsyncStorage.`);
          } catch (saveError) {
            console.error("CHAT_SCREEN [handleSendMessage Guest Save Error]: Failed to save guest messages:", saveError);
            Alert.alert("Save Error", "Could not save the conversation history.");
          }
          scrollToBottom(); // Scroll after adding AI message
        }
      } else {
        console.error("CHAT_SCREEN: Cannot send message - missing character ID.");
        Alert.alert("Error", "Character information is missing.");
        setIsAISpeaking(false);
      }
    } catch (error) {
      console.error("CHAT_SCREEN: Error sending message:", error);
      Alert.alert("Error", `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsAISpeaking(false);
      // Optionally add an error message to the chat UI
      setMessages(prev => [{ id: uuidv4(), text: `Error sending: ${error instanceof Error ? error.message : 'Unknown error'}`, sender: 'ai', timestamp: Date.now() }, ...prev]);
    }
  }, [messages, user?.id, character?.id, isAISpeaking, stagedMedia, scrollToBottom, inputText]); // Keep inputText dependency


  // Render message item
  const renderItem = useCallback(({ item }: { item: UIMessage }) => (
    <MessageItem
      item={item}
      characterAvatar={character.avatar}
      colors={colors}
      isDarkMode={isDarkMode}
      animation={getMessageAnimation(item.id)}
    />
  ), [character?.avatar, colors, isDarkMode, getMessageAnimation]); // Dependencies for renderItem


  // Determine background source based on theme
  const backgroundSource = useMemo(() => {
    if (selectedTheme.background) {
      return selectedTheme.background;
    }
    // Return null or a default background if needed when no theme background is set
    return undefined; // Let ImageBackground handle undefined source potentially
  }, [selectedTheme]);

  // Debug log for messages state changes
  useEffect(() => {
    console.log('CHAT_SCREEN [State Update]: messages state changed:', {
      count: messages.length,
      isLoading,
      isGuest: !user?.id,
      firstMsgText: messages[0]?.text.substring(0, 20) + '...', // Log first message snippet
      lastMsgText: messages[messages.length - 1]?.text.substring(0, 20) + '...' // Log last message snippet
    });
  }, [messages, isLoading, user]); // Dependencies array

  // Moved isLoading check here to ensure hooks are called consistently
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.card }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
          handleBack={() => navigation.goBack()}
          handleThemePress={handleThemePress}
        />
        {!user?.id && <GuestModeBanner colors={colors} onUpgradePress={() => navigation.navigate('Login')} />}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flexOne}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0} // Adjust offset as needed
        >
          <View style={styles.container}>
            <FlatList
              ref={flatListRef}
              // Log the data prop being passed to FlatList (only when it changes significantly)
              data={messages} // Log messages state directly if needed: console.log('[FlatList Data] Passing messages to FlatList:', messages);
              renderItem={renderItem}
              onLayout={() => console.log(`CHAT_SCREEN [FlatList]: Rendering with messages count: ${messages.length}`)} // Simplified log
              keyExtractor={(item) => String(item.id)}
              style={styles.messageList}
              contentContainerStyle={styles.messageListContent}
              inverted // Display messages from bottom to top
              keyboardShouldPersistTaps="handled"
              {...FLATLIST_OPTIMIZATION_PROPS} // Apply optimizations
              ListFooterComponent={isAISpeaking ? <TypingIndicatorDisplay character={character} colors={colors} /> : null}
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
              onMicPress={handleMicPress}
              onAttachPress={handleAttachPress}
              stagedMedia={stagedMedia}
              clearStagedMedia={clearStagedMedia}
            />
            {/* Display recording duration */}
            {recording && (
                <View style={styles.recordingIndicator}>
                    <Text style={styles.recordingText}>Recording: {recordingDuration}s</Text>
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
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
  },
  container: {
    flex: 1,
    // backgroundColor: 'transparent', // Ensure container is transparent for background
  },
  flexOne: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    // backgroundColor set dynamically
    // borderBottomColor set dynamically
  },
  headerButton: {
    padding: 5, // Add padding for easier tapping
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center avatar and title
    marginHorizontal: 10, // Add some space around the center content
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 1, // Add border for visibility
    // borderColor set dynamically
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    // color set dynamically
    maxWidth: '80%', // Prevent title from overlapping buttons
  },
  guestBanner: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor set dynamically
  },
  guestBannerText: {
    fontSize: 13,
    marginRight: 8,
    // color set dynamically
  },
  guestBannerLink: {
    fontSize: 13,
    fontWeight: 'bold',
    // color set dynamically (primary)
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 10,
    // backgroundColor: 'transparent', // Ensure list is transparent
  },
  messageListContent: {
    paddingVertical: 10, // Add padding to top and bottom of content
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
    width: 40, // Fixed width for avatar container
    marginRight: 8,
    alignSelf: 'flex-start', // Align avatar to the top of the row
    paddingTop: 5, // Add padding to align with bubble text slightly better
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    // borderColor set dynamically
  },
  userAvatarPlaceholder: {
    width: 40, // Match AI avatar container width
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '75%', // Limit bubble width
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    elevation: 1, // Android shadow
    shadowOffset: { width: 0, height: 1 }, // iOS shadow
    shadowOpacity: 0.2,
    shadowRadius: 1,
    // backgroundColor set dynamically
    // shadowColor set dynamically
  },
  userMessageBubble: {
    borderBottomRightRadius: 4, // Slightly flatten user bubble corner
    // backgroundColor set dynamically
  },
  aiMessageBubble: {
    borderBottomLeftRadius: 4, // Slightly flatten AI bubble corner
    // backgroundColor set dynamically
    // borderWidth, borderColor set dynamically for light mode
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    // color set dynamically
  },
  messageTimestamp: {
    fontSize: 10,
    // color set dynamically
    alignSelf: 'flex-end', // Position timestamp to the right
    marginTop: 4,
    opacity: 0.7,
  },
  inputAreaContainer: {
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10, // More padding for iOS home indicator area
    paddingTop: 10,
    paddingHorizontal: 10,
    // backgroundColor, borderTopColor set dynamically
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center', // Align items vertically
  },
  textInput: {
    flex: 1,
    minHeight: 40, // Minimum height
    maxHeight: 120, // Maximum height before scrolling
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 10, // Adjust vertical padding
    fontSize: 15,
    marginHorizontal: 8, // Space between buttons and input
    // backgroundColor, color, borderColor set dynamically
  },
  inputActionButton: {
    padding: 8, // Hit area for buttons
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8, // Space between mic and send
    // backgroundColor set dynamically
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  typingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15, // Match message padding
    // backgroundColor set dynamically (usually same as chat background)
  },
  typingIndicatorAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginRight: 8,
      borderWidth: 1,
      // borderColor set dynamically
  },
  typingIndicatorText: {
      fontSize: 13,
      // color set dynamically (subText)
      marginRight: 4,
  },
  typingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 10, // Fixed height for alignment
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
    // backgroundColor set dynamically (typingIndicator color)
  },
  // Staged Media Styles
  stagedMediaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 5,
    // backgroundColor: colors.inputBackground, // Use input background
    borderRadius: 10,
  },
  stagedMediaText: {
    fontSize: 12,
    // color: colors.subText,
    marginRight: 8,
  },
  clearMediaButton: {
    marginLeft: 'auto', // Push to the right
    padding: 2,
  },
  // Recording Indicator Styles
  recordingIndicator: {
    position: 'absolute',
    bottom: 70, // Adjust position as needed
    left: 0,
    right: 0,
    alignItems: 'center',
    padding: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  recordingText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  // Theme Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    // backgroundColor set dynamically (card)
    maxHeight: '80%', // Limit modal height
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    // color set dynamically (text)
  },
  themeListContainer: {
    alignItems: 'center', // Center items if not filling width
    paddingBottom: 10,
  },
  themeItem: {
    margin: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 10,
    padding: 5,
    // borderColor set dynamically
    width: 120, // Fixed width for theme items
  },
  themePreview: {
    width: 100,
    height: 150, // Adjust aspect ratio as needed
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Ensure border radius applies to image
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)', // Light border for preview itself
  },
  themePreviewImage: {
    borderRadius: 8, // Apply border radius to the image itself
  },
  defaultThemePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    // backgroundColor set dynamically (background)
  },
  themeName: {
    fontSize: 12,
    // color set dynamically (subText)
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    // color set dynamically (closeButton color)
  },
});
