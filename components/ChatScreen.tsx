import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import {
  View,
  Text,
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
  Alert,
  Pressable,
  ImageSourcePropType,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../utils/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { Ionicons } from '@expo/vector-icons';
import {
  getChatMessages,
  sendMessage as sendMessageToDb,
  subscribeToNewMessages,
  unsubscribeFromChat,
  Message,
} from '../services/conversationService';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { OPENROUTER_API_KEY, AI_MODELS, CHARACTER_PROMPTS } from '../utils/aiConfig';

// --- Types and Interfaces ---

type GuestChatSessionData = {
  id: number;
  characterId: number;
  name: string;
  avatar: string | number | null;
  lastMessage: string;
  lastInteractionAt: string;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;
type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

interface Character {
  id: number;
  name: string;
  description?: string;
  avatar: ImageSourcePropType | string;
  tags?: string[];
  category?: string;
  openingMessage?: string;
  exampleQuestions?: string[];
  suggestedQuestions?: string[];
  greeting?: string;
  image_url?: string;
  model?: string;
  system_prompt?: string;
}

interface UIMessage {
  id: string | number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  image_url?: string;
  audio_url?: string;
  type: 'message';
}

// Define type for Date Separator item
interface DateSeparatorItem {
  id: string;
  type: 'date-separator';
  date: string; // Formatted date string (e.g., "Today", "Yesterday", "April 15, 2025")
}

// Combined type for FlatList data
type ListItem = UIMessage | DateSeparatorItem;

interface ChatScreenProps {
  route: ChatScreenRouteProp;
}

interface MessageItemProps {
  item: UIMessage;
  characterAvatar: ImageSourcePropType | string;
}

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  handleSend: () => void;
  isAISpeaking: boolean;
  sendButtonScale: Animated.Value;
  handlePressInSend: () => void;
  handlePressOutSend: () => void;
  onMicPress?: () => void;
  onAttachPress?: () => void;
  stagedMedia: StagedMedia | null;
  clearStagedMedia: () => void;
  isRecording: boolean;
}

interface ChatHeaderProps {
  character: Character | null;
  handleBack: () => void;
}

interface TypingIndicatorDisplayProps {
  character: Character | null;
}

interface DateSeparatorProps {
  date: string;
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
  mimeType?: string;
}

type OpenRouterMessageContent =
  | string
  | Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string; detail?: 'auto' | 'low' | 'high' } }
    >;

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
  windowSize: 11,
};

const CHAT_THEMES: ChatTheme[] = [
  { id: 'default', name: 'Default', background: null },
  { id: 'gradient1', name: 'Sunset', background: require('../assets/chat-bg/gradient1.png') },
  { id: 'gradient2', name: 'Ocean', background: require('../assets/chat-bg/gradient2.png') },
  { id: 'pattern1', name: 'Bubbles', background: require('../assets/chat-bg/pattern1.png') },
  { id: 'pattern2', name: 'Stars', background: require('../assets/chat-bg/pattern2.png') },
];

// --- Helper Functions ---

/**
 * Get appropriate avatar source based on avatar value
 */
const getAvatarSource = (avatar: Character['avatar'] | undefined | null): ImageSourcePropType => {
  if (!avatar) {
    return require('../assets/profile-placeholder.png');
  }
  if (typeof avatar === 'number') {
    return avatar;
  }
  if (typeof avatar === 'string' && avatar.startsWith('http')) {
    return { uri: avatar };
  }
  console.warn("Avatar is a string but not a URL, using placeholder:", avatar);
  return require('../assets/profile-placeholder.png');
};

/**
 * Map database message to UI message format
 */
function mapDbMessageToUIMessage(dbMsg: Message): UIMessage {
  if (!dbMsg) {
    console.warn("Attempted to map undefined or null database message");
    return {
      id: Crypto.randomUUID(),
      text: '[Message Error]',
      sender: 'ai',
      timestamp: Date.now(),
      type: 'message',
    };
  }
  
  return {
    id: dbMsg.id ?? Crypto.randomUUID(),
    text: dbMsg.content ?? '[empty message]',
    sender: (dbMsg.sender ?? 'ai') as 'user' | 'ai',
    timestamp: dbMsg.created_at ? new Date(dbMsg.created_at).getTime() : Date.now(),
    type: 'message',
  };
}

/**
 * Generate welcome message for character
 */
function generateWelcomeMessage(char: Character): string {
  if (!char) return "Welcome! How can I help you today?";
  
  if (char.greeting) return char.greeting;
  if (char.openingMessage) {
    const questionList = (char.exampleQuestions || []).map((q: string) => `• ${q}`).join('\n');
    return `${char.openingMessage}${questionList ? `\n\nHere are some things I can help with:\n${questionList}` : ''}`;
  }
  return `Hello! I'm ${char.name}. How can I help you today?`;
}

/**
 * Update guest chat session in AsyncStorage
 */
async function updateGuestChatSession(
  characterId: number, 
  characterName: string, 
  lastMessageText: string
): Promise<void> {
  if (!characterId || isNaN(characterId) || characterId <= 0) {
    console.warn("Invalid character ID for guest chat session:", characterId);
    return;
  }

  try {
    const now = new Date().toISOString();
    const currentChatsRaw = await AsyncStorage.getItem(GUEST_CHATS_STORAGE_KEY);
    let currentChats: GuestChatSessionData[] = [];
    
    // Parse existing chats or initialize empty array
    if (currentChatsRaw) {
      try {
        const parsed = JSON.parse(currentChatsRaw);
        currentChats = Array.isArray(parsed) ? parsed : [];
      } catch (parseError) {
        console.error("Error parsing guest chats:", parseError);
        currentChats = [];
      }
    }

    const existingIndex = currentChats.findIndex(chat => chat.characterId === characterId);
    const sessionData: GuestChatSessionData = {
      id: characterId,
      characterId: characterId,
      name: characterName,
      avatar: null,
      lastMessage: lastMessageText.substring(0, 100),
      lastInteractionAt: now
    };

    if (existingIndex > -1) {
      currentChats[existingIndex] = sessionData;
    } else {
      currentChats.push(sessionData);
    }

    // Sort by most recent
    currentChats.sort((a, b) => 
      new Date(b.lastInteractionAt).getTime() - new Date(a.lastInteractionAt).getTime()
    );

    // Limit to 15 most recent chats
    const limitedChats = currentChats.slice(0, 15);

    await AsyncStorage.setItem(GUEST_CHATS_STORAGE_KEY, JSON.stringify(limitedChats));
  } catch (error) {
    console.error("Error updating guest chat session:", error);
  }
}

/**
 * Format date for separators
 */
function formatDateSeparator(timestamp: number): string {
  const messageDate = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  messageDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);

  if (messageDate.getTime() === today.getTime()) {
    return 'Today';
  }
  if (messageDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }
  return messageDate.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// --- Subcomponents ---

/**
 * Typing indicator animation component
 */
const TypingIndicator = React.memo(() => {
  const { colors } = useTheme();
  const yAnims = useRef([
    new Animated.Value(0), 
    new Animated.Value(0), 
    new Animated.Value(0)
  ]).current;

  useEffect(() => {
    const createAnimation = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: -5,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(600 - delay)
        ])
      );
    };

    const animations = yAnims.map((anim, index) => createAnimation(anim, index * 150));
    animations.forEach(anim => anim.start());

    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, [yAnims]);

  const styles = useMemo(() => StyleSheet.create({
    typingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    typingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.secondaryText,
      marginHorizontal: 2,
    },
  }), [colors]);

  return (
    <View style={styles.typingContainer}>
      {yAnims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.typingDot,
            { transform: [{ translateY: anim }] },
          ]}
        />
      ))}
    </View>
  );
});

/**
 * Typing indicator display with avatar
 */
const TypingIndicatorDisplay = React.memo(({ character }: TypingIndicatorDisplayProps) => {
  const { colors } = useTheme();
  
  if (!character) return null;
  
  const avatarSource = getAvatarSource(character.avatar);

  const styles = useMemo(() => StyleSheet.create({
    typingDisplayContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginVertical: 8,
      paddingHorizontal: 10,
    },
    typingAvatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      marginRight: 8,
      marginBottom: 5,
    },
    typingBubble: {
      backgroundColor: colors.cardBg,
      borderRadius: 18,
      borderBottomLeftRadius: 4,
      paddingVertical: 2,
      paddingHorizontal: 5,
      maxWidth: '70%',
    },
  }), [colors]);

  return (
    <View style={styles.typingDisplayContainer}>
      <Image
        source={avatarSource}
        style={styles.typingAvatar}
      />
      <View style={styles.typingBubble}>
        <TypingIndicator />
      </View>
    </View>
  );
});

/**
 * Message item component
 */
const MessageItem = React.memo(({ item, characterAvatar }: MessageItemProps) => {
  const { colors, isDarkMode } = useTheme();
  const isUser = item.sender === 'user';
  const formattedTime = useMemo(() => {
    return new Date(item.timestamp).toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  }, [item.timestamp]);
  
  const aiAvatarSource = useMemo(() => getAvatarSource(characterAvatar), [characterAvatar]);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { 
        toValue: 1, 
        duration: MESSAGE_ANIMATION_DURATION, 
        useNativeDriver: true 
      }),
      Animated.timing(slideAnim, { 
        toValue: 0, 
        duration: MESSAGE_ANIMATION_DURATION, 
        useNativeDriver: true 
      }),
      Animated.timing(scaleAnim, { 
        toValue: 1, 
        duration: MESSAGE_ANIMATION_DURATION, 
        useNativeDriver: true 
      })
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  const styles = useMemo(() => StyleSheet.create({
    messageRow: {
      flexDirection: 'row',
      marginVertical: 8,
      paddingHorizontal: 10,
    },
    userMessageRow: {
      justifyContent: 'flex-end',
      marginLeft: '20%',
    },
    aiMessageRow: {
      justifyContent: 'flex-start',
      marginRight: '20%',
    },
    avatarContainer: {
      marginRight: 8,
      alignSelf: 'flex-end',
      marginBottom: 5,
    },
    avatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
    },
    userMessageContainer: {
      alignItems: 'flex-end',
    },
    userMessageBubble: {
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 20,
      borderBottomRightRadius: 5,
      backgroundColor: colors.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 3,
      elevation: 3,
    },
    userMessageText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.buttonText,
    },
    timestampReadStatusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
      alignSelf: 'flex-end',
    },
    userTimestamp: {
      fontSize: 11,
      color: isDarkMode ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.75)',
      marginRight: 5,
    },
    readStatusIcon: {
      // Style for the checkmark icon
    },
    aiMessageBubble: {
      backgroundColor: colors.cardBg,
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 20,
      borderBottomLeftRadius: 5,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1.5 },
      shadowOpacity: 0.1,
      shadowRadius: 2.5,
      elevation: 2,
    },
    messageText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.text,
    },
    timestamp: {
      fontSize: 11,
      color: colors.secondaryText,
      marginTop: 6,
      alignSelf: 'flex-start',
    },
  }), [colors, isDarkMode]);

  return (
    <Animated.View
      style={[
        styles.messageRow,
        isUser ? styles.userMessageRow : styles.aiMessageRow,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }
      ]}
    >
      {!isUser && (
        <View style={styles.avatarContainer}>
          <Image 
            source={aiAvatarSource} 
            style={styles.avatar} 
            onError={(e) => console.warn("AI avatar error:", e.nativeEvent.error)} 
          />
        </View>
      )}

      {isUser ? (
        <View style={styles.userMessageContainer}>
          <View style={styles.userMessageBubble}>
            <Text style={styles.userMessageText}>{item.text}</Text>
            <View style={styles.timestampReadStatusContainer}>
              <Text style={styles.userTimestamp}>{formattedTime}</Text>
              <Ionicons 
                name="checkmark-done" 
                size={15} 
                color={isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.8)'} 
                style={styles.readStatusIcon} 
              />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.aiMessageBubble}>
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.timestamp}>{formattedTime}</Text>
        </View>
      )}
    </Animated.View>
  );
});

/**
 * Chat input component
 */
const ChatInput = React.memo(({
  inputText,
  setInputText,
  handleSend,
  isAISpeaking,
  isRecording,
  sendButtonScale,
  handlePressInSend,
  handlePressOutSend,
  onMicPress,
  onAttachPress,
  stagedMedia,
  clearStagedMedia
}: ChatInputProps) => {
  const { colors } = useTheme();
  const hasStagedMedia = stagedMedia !== null;
  const canSendText = inputText.trim().length > 0;
  const canSend = !isAISpeaking && (canSendText || hasStagedMedia);
  const showMicButton = !canSendText;

  const styles = useMemo(() => StyleSheet.create({
    inputAreaContainer: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
      paddingBottom: Platform.OS === 'ios' ? 25 : 15,
      paddingTop: 8,
    },
    stagedMediaContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.cardBg,
      marginHorizontal: 10,
      borderRadius: 10,
      marginBottom: 5,
    },
    stagedMediaText: {
      flex: 1,
      fontSize: 14,
      color: colors.secondaryText,
      marginLeft: 5,
    },
    clearMediaButton: {
      padding: 5,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingVertical: 5,
      paddingHorizontal: 10,
    },
    inputActionButton: {
      padding: 10,
      marginHorizontal: 3,
      marginBottom: 5,
      justifyContent: 'center',
      alignItems: 'center',
    },
    inputActionButtonDisabled: {
      opacity: 0.4,
    },
    inputActionButtonPressed: {
      opacity: 0.6,
    },
    textInputContainer: {
      flex: 1,
      backgroundColor: colors.inputBackground,
      borderRadius: 22,
      paddingHorizontal: 18,
      paddingVertical: Platform.OS === 'ios' ? 12 : 10,
      marginHorizontal: 5,
      minHeight: 44,
      maxHeight: 120,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    textInput: {
      fontSize: 16,
      color: colors.text,
      paddingTop: 0,
      paddingBottom: 0,
    },
    micSendButtonBase: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 5,
      marginBottom: 0,
    },
    micButtonStyle: {
      // Mic usually doesn't need a background unless recording indicator is added
    },
    sendButtonStyle: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    buttonDisabled: {
      backgroundColor: colors.secondaryText,
      opacity: 0.5,
      elevation: 0,
      shadowOpacity: 0,
    },
    buttonPressed: {
      transform: [{ scale: 0.92 }],
      shadowOpacity: 0.15,
    },
    sendButtonPressedSpecific: {
      backgroundColor: colors.primaryDark,
      transform: [{ scale: 0.92 }],
      shadowOpacity: 0.1,
    }
  }), [colors]);

  const iconColor = colors.icon;
  const placeholderTextColor = colors.secondaryText;

  const isButtonDisabled = showMicButton ? (isAISpeaking || hasStagedMedia) : !canSend;
  const buttonOnPress = showMicButton ? onMicPress : handleSend;
  const buttonOnPressIn = showMicButton ? undefined : handlePressInSend;
  const buttonOnPressOut = showMicButton ? undefined : handlePressOutSend;

  return (
    <View style={styles.inputAreaContainer}>
      {hasStagedMedia && (
        <View style={[styles.stagedMediaContainer, { borderBottomColor: colors.border }]}>
          <Text style={[styles.stagedMediaText, { color: colors.secondaryText }]}>
            {stagedMedia.type === 'image' ? 'Image' : 'Audio'} ready
          </Text>
          <Pressable
            onPress={clearStagedMedia}
            style={({ pressed }) => [
              styles.clearMediaButton,
              pressed && { opacity: 0.7 }
            ]}
          >
            <Ionicons name="close-circle" size={18} color={colors.secondaryText} />
          </Pressable>
        </View>
      )}

      <View style={styles.inputRow}>
        <Pressable
          onPress={onAttachPress}
          disabled={isAISpeaking || hasStagedMedia}
          style={({ pressed }) => [
            styles.inputActionButton,
            (isAISpeaking || hasStagedMedia) && styles.inputActionButtonDisabled,
            pressed && !(isAISpeaking || hasStagedMedia) && styles.inputActionButtonPressed
          ]}
        >
          <Ionicons name="attach-outline" size={24} color={iconColor} />
        </Pressable>

        <Pressable
          onPress={() => console.log('Camera pressed')}
          disabled={isAISpeaking}
          style={({ pressed }) => [
            styles.inputActionButton,
            isAISpeaking && styles.inputActionButtonDisabled,
            pressed && !isAISpeaking && styles.inputActionButtonPressed
          ]}
        >
          <Ionicons name="camera-outline" size={24} color={iconColor} />
        </Pressable>

        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={placeholderTextColor}
            value={inputText}
            onChangeText={setInputText}
            multiline
            editable={!isAISpeaking}
          />
        </View>

        <Pressable
          onPress={buttonOnPress}
          onPressIn={buttonOnPressIn}
          onPressOut={buttonOnPressOut}
          disabled={isButtonDisabled}
          style={({ pressed }) => [
            styles.micSendButtonBase,
            showMicButton ? styles.micButtonStyle : styles.sendButtonStyle,
            isButtonDisabled && styles.buttonDisabled,
            pressed && !isButtonDisabled && styles.buttonPressed,
            pressed && !isButtonDisabled && !showMicButton && styles.sendButtonPressedSpecific,
          ]}
        >
          {showMicButton ? (
            <Ionicons 
              name={isRecording ? "stop-circle-outline" : "mic-outline"} 
              size={24} 
              color={iconColor} 
            />
          ) : (
            <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
              <Ionicons name="send" size={18} color={colors.buttonText} style={{ marginLeft: -1 }} />
            </Animated.View>
          )}
        </Pressable>
      </View>
    </View>
  );
});

/**
 * Chat header component
 */
const ChatHeader = React.memo(({ character, handleBack }: ChatHeaderProps) => {
  const { colors } = useTheme();
  const avatarSource = useMemo(() => getAvatarSource(character?.avatar), [character?.avatar]);
  const characterName = character?.name || 'Chat';

  const styles = useMemo(() => StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 10,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerButtonLeft: {
      padding: 8,
      marginLeft: 0,
    },
    headerCenter: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      marginLeft: 10,
      marginRight: 40,
    },
    headerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
    },
    headerTextContainer: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
    },
    headerStatus: {
      fontSize: 12,
      color: colors.success,
      marginTop: 2,
    },
    headerRightButtons: {
      position: 'absolute',
      right: 10,
      flexDirection: 'row',
      alignItems: 'center',
      height: '100%',
    },
    headerButtonRight: {
      padding: 8,
      marginLeft: 8,
    },
  }), [colors]);

  return (
    <View style={styles.header}>
      <Pressable onPress={handleBack} style={styles.headerButtonLeft}>
        <Ionicons name="chevron-back" size={30} color={colors.icon} />
      </Pressable>
      <View style={styles.headerCenter}>
        <Image 
          source={avatarSource} 
          style={styles.headerAvatar} 
          onError={(e) => console.warn("Header avatar error:", e.nativeEvent.error)} 
        />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{characterName}</Text>
          <Text style={styles.headerStatus}>
            Online
          </Text>
        </View>
      </View>
      <View style={styles.headerRightButtons}>
        <Pressable style={styles.headerButtonRight} onPress={() => console.log('More options')}>
          <Ionicons name="ellipsis-vertical" size={24} color={colors.icon} />
        </Pressable>
      </View>
    </View>
  );
});

/**
 * Date separator component
 */
const DateSeparator = React.memo(({ date }: DateSeparatorProps) => {
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    dateSeparatorContainer: {
      alignItems: 'center',
      marginVertical: 10,
    },
    dateSeparatorText: {
      color: colors.secondaryText,
      fontSize: 11,
      fontWeight: '500',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      overflow: 'hidden',
    },
  }), [colors]);

  return (
    <View style={styles.dateSeparatorContainer}>
      <Text style={styles.dateSeparatorText}>{date}</Text>
    </View>
  );
});

// --- Main Component ---

export default function ChatScreen({ route }: ChatScreenProps) {
  const { colors } = useTheme();
  const { character: routeCharacter } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const { user, isGuest } = useAuth();
  
  // Refs
  const flatListRef = useRef<FlatList>(null);
  const isSendingRef = useRef(false);
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  
  // State
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [stagedMedia, setStagedMedia] = useState<StagedMedia | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ChatTheme>(CHAT_THEMES[0]);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);

  // Process the character from route params
  const character: Character | null = useMemo(() => {
    if (!routeCharacter) return null;
    
    return {
      ...routeCharacter,
      id: Number(routeCharacter.id),
      model: routeCharacter.model,
      system_prompt: routeCharacter.system_prompt,
    };
  }, [routeCharacter]);

  // Create list data with date separators
  const listData = useMemo(() => {
    const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);
    const itemsWithSeparators: ListItem[] = [];
    let lastDateString: string | null = null;

    sortedMessages.forEach((message) => {
      const messageDate = new Date(message.timestamp);
      const messageDateString = formatDateSeparator(message.timestamp);

      if (messageDateString !== lastDateString) {
        itemsWithSeparators.push({
          id: `date-${messageDate.toISOString().split('T')[0]}`,
          type: 'date-separator',
          date: messageDateString,
        });
        lastDateString = messageDateString;
      }
      itemsWithSeparators.push(message);
    });
    
    return itemsWithSeparators;
  }, [messages]);

  // Load chat history and subscribe to new messages
  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let isMounted = true;

    const loadHistoryAndSubscribe = async () => {
      if (!character) {
        setIsLoadingHistory(false);
        return;
      }
      
      setIsLoadingHistory(true);
      let initialMessages: UIMessage[] = [];
      
      try {
        if (user?.id) {
          console.log(`ChatScreen: Loading chat history {"character": "${character.name}", "userId": "${user.id}"}`);
          const dbMessages = await getChatMessages(user.id, character.id);
          initialMessages = dbMessages.map(mapDbMessageToUIMessage);
          
          channel = subscribeToNewMessages(user.id, character.id, (newMessage) => {
            if (isMounted) {
              setMessages(prev => [...prev, mapDbMessageToUIMessage(newMessage)]);
            }
          });
        } else if (isGuest) {
          console.log(`ChatScreen: Loading chat history {"character": "${character.name}", "isGuest": true}`);
          // Guest mode - no history to load
        }

        if (isMounted) {
          if (initialMessages.length === 0) {
            console.log('ChatScreen: Adding welcome message');
            const welcomeText = generateWelcomeMessage(character);
            const welcomeMessage: UIMessage = {
              id: 'welcome-' + uuidv4(),
              text: welcomeText,
              sender: 'ai',
              timestamp: Date.now(),
              type: 'message',
            };
            setMessages([welcomeMessage]);
          } else {
            setMessages(initialMessages);
          }
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      }
    };

    loadHistoryAndSubscribe();

    return () => {
      isMounted = false;
      if (channel && user?.id && character?.id) {
        unsubscribeFromChat(channel);
      }
    };
  }, [user, isGuest, character]);

  // Helper function to scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  // Clear staged media
  const clearStagedMedia = useCallback(() => {
    setStagedMedia(null);
  }, []);

  // Send button animation handlers
  const handlePressInSend = () => {
    Animated.spring(sendButtonScale, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOutSend = () => {
    Animated.spring(sendButtonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Fetch AI completion from OpenRouter
  const fetchOpenRouterCompletion = useCallback(async (
    payloadMessages: OpenRouterMessage[],
    char: Character,
    originalUserMessageId: string | number
  ) => {
    console.log('[fetchOpenRouterCompletion] Triggered');
    
    if (!char) {
      console.log('[fetchOpenRouterCompletion] Aborted: No character');
      setIsAISpeaking(false);
      return;
    }

    const aiModel = char.model || AI_MODELS.default;
    console.log(`[fetchOpenRouterCompletion] Using model: ${aiModel}`);
    
    setShowTypingIndicator(true);
    
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: aiModel,
          messages: payloadMessages,
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("[fetchOpenRouterCompletion] API Error:", errorBody);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponseText = data.choices[0]?.message?.content?.trim();

      if (aiResponseText) {
        console.log('[fetchOpenRouterCompletion] Received AI response');
        
        const aiMessage: UIMessage = {
          id: uuidv4(),
          text: aiResponseText,
          sender: 'ai',
          timestamp: Date.now(),
          type: 'message',
        };

        // Save AI message
        if (user?.id) {
          await sendMessageToDb(user.id, char.id, aiResponseText, 'ai');
        } else if (isGuest) {
          await updateGuestChatSession(char.id, char.name, aiResponseText);
        }

        setMessages(prev => [...prev, aiMessage]);
        scrollToBottom();
      } else {
        console.warn("[fetchOpenRouterCompletion] Received empty AI response");
      }
    } catch (error) {
      console.error("[fetchOpenRouterCompletion] Error:", error);
      Alert.alert("AI Error", "Sorry, I couldn't get a response from the AI.");
    } finally {
      setShowTypingIndicator(false);
      setIsAISpeaking(false);
    }
  }, [user, isGuest, scrollToBottom]);

  // Handle sending a message
  const handleSendMessage = useCallback(async () => {
    if (isSendingRef.current || !character) {
      return;
    }
    
    isSendingRef.current = true;
    
    try {
      const messageText = inputText.trim();
      
      if (!messageText && !stagedMedia) {
        return;
      }
      
      const messageId = uuidv4();
      const timestamp = Date.now();
      
      // Prepare message for UI
      const newUserMessage: UIMessage = {
        id: messageId,
        text: messageText,
        sender: 'user',
        timestamp,
        type: 'message',
      };
      
      // Save user message
      if (user?.id) {
        await sendMessageToDb(user.id, character.id, messageText, 'user');
      } else if (isGuest) {
        await updateGuestChatSession(character.id, character.name, messageText);
      }
      
      setMessages(prev => [...prev, newUserMessage]);
      setInputText('');
      clearStagedMedia();
      scrollToBottom();
      
      // Prepare system prompt + conversation history for AI
      setIsAISpeaking(true);
      
      const systemPrompt = character.system_prompt || 
        `You are ${character.name}, ${character.description || 'an AI assistant'}. Be helpful and friendly.`;
      
      // Build message history for context (limit to last 10 messages)
      const recentMessages = [...messages]
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-10)
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));
      
      // Build full payload with system prompt, history, and current message
      const fullPayload: OpenRouterMessage[] = [
        { role: 'system', content: systemPrompt },
        ...recentMessages,
        { role: 'user', content: messageText }
      ];
      
      // Send to AI service
      fetchOpenRouterCompletion(fullPayload, character, messageId);
    } catch (error) {
      console.error("Error sending message:", error);
      setIsAISpeaking(false);
      Alert.alert("Error", "Failed to send message. Please try again.");
    } finally {
      isSendingRef.current = false;
    }
  }, [
    character, 
    inputText, 
    stagedMedia, 
    messages, 
    user, 
    isGuest, 
    fetchOpenRouterCompletion, 
    clearStagedMedia, 
    scrollToBottom
  ]);

  // Handle attachment functionality
  const handleAttachPress = useCallback(async () => {
    if (isAISpeaking) return;
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          setStagedMedia({
            uri: asset.uri,
            base64: asset.base64,
            type: 'image',
            mimeType: 'image/jpeg',
          });
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  }, [isAISpeaking]);

  // Handle mic press/audio recording
  const handleMicPress = useCallback(async () => {
    if (isAISpeaking || isRecording || stagedMedia) return;
    
    try {
      if (recording) {
        setIsRecording(false);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        
        if (uri) {
          try {
            const base64 = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            
            setStagedMedia({
              uri,
              base64,
              type: 'audio',
              mimeType: 'audio/m4a',
            });
          } catch (error) {
            console.error("Error reading audio file:", error);
          }
        }
        
        setRecording(null);
      } else {
        setIsRecording(true);
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        
        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        
        setRecording(newRecording);
      }
    } catch (error) {
      console.error("Error with audio recording:", error);
      setIsRecording(false);
      setRecording(null);
    }
  }, [isAISpeaking, isRecording, stagedMedia, recording]);

  // Handle back button press
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Render item for FlatList
  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if (item.type === 'date-separator') {
      return <DateSeparator date={item.date} />;
    }
    
    return (
      <MessageItem 
        item={item} 
        characterAvatar={character?.avatar || ''} 
      />
    );
  }, [character]);

  // Render background based on current theme
  const renderBackground = () => {
    if (!currentTheme.background) return null;
    
    return (
      <ImageBackground
        source={currentTheme.background}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
    );
  };

  // Styles
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backgroundImage: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.9,
    },
    contentContainer: {
      flex: 1,
    },
    flatList: {
      flex: 1,
    },
    loadingText: {
      marginTop: 10,
      color: colors.text,
    },
  });

  // Loading state
  if (isLoadingHistory) {
    return (
      <SafeAreaView style={styles.container}>
        <ChatHeader character={character} handleBack={handleBack} />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderBackground()}
      
      <ChatHeader character={character} handleBack={handleBack} />
      
      <KeyboardAvoidingView
        style={styles.contentContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={listData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingVertical: 10 }}
          onLayout={scrollToBottom}
          style={styles.flatList}
          {...FLATLIST_OPTIMIZATION_PROPS}
        />
        
        {showTypingIndicator && character && (
          <TypingIndicatorDisplay character={character} />
        )}
        
        <ChatInput
          inputText={inputText}
          setInputText={setInputText}
          handleSend={handleSendMessage}
          isAISpeaking={isAISpeaking}
          isRecording={isRecording}
          sendButtonScale={sendButtonScale}
          handlePressInSend={handlePressInSend}
          handlePressOutSend={handlePressOutSend}
          onMicPress={handleMicPress}
          onAttachPress={handleAttachPress}
          stagedMedia={stagedMedia}
          clearStagedMedia={clearStagedMedia}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
