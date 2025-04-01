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
  ActivityIndicator,
  SafeAreaView,
  Keyboard,
  Modal,
  ImageBackground,
  Animated,
  Alert,
  Pressable, // Using Pressable
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  getChatMessages,
  sendMessage as sendMessageToDb,
  subscribeToNewMessages,
  unsubscribeFromChat,
  Message as DbMessage
} from '../services/conversationService';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Types and Interfaces ---

type GuestChatSessionData = {
  id: number;
  characterId: number;
  name: string;
  avatar: string | number | null;
  lastMessage: string;
  lastInteractionAt: string;
};

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

type UIMessage = {
  id: string | number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
};

interface Character {
  id: number;
  name: string;
  description?: string;
  avatar: any;
  tags?: string[];
  category?: string;
  openingMessage?: string;
  exampleQuestions?: string[];
  greeting?: string;
  image_url?: string;
}

// Define Props interface before the component that uses it
interface ChatScreenProps {
  route: {
    params: {
      character: Character;
    };
  };
  navigation: NavigationProp;
}

// --- Constants ---

const GUEST_CHATS_STORAGE_KEY = 'guestChats';

const CHAT_THEMES = [
  { id: 'default', name: 'Default', background: null },
  { id: 'gradient1', name: 'Sunset', background: require('../assets/chat-bg/gradient1.png') },
  { id: 'gradient2', name: 'Ocean', background: require('../assets/chat-bg/gradient2.png') },
  { id: 'pattern1', name: 'Bubbles', background: require('../assets/chat-bg/pattern1.png') },
  { id: 'pattern2', name: 'Stars', background: require('../assets/chat-bg/pattern2.png') },
];

const MESSAGE_ANIMATION_DURATION = 300;

// --- Styles (Defined once, before components) ---
const styles = StyleSheet.create({
  // Layout containers
  container: {
    flex: 1,
  },
  chatAreaContainer: {
    flex: 1,
  },
  chatBackgroundImage: {
    opacity: 0.5,
  },

  // Header styles
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 64,
    // Dynamic: backgroundColor, borderBottomColor
    // Static shadow:
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  headerButton: { // Improved touch target
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenterContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    overflow: 'hidden',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1.5,
    // Dynamic: borderColor
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    flexShrink: 1,
    marginLeft: 4,
    // Dynamic: color
  },

  // Chat list styles
  loadingIndicator: {
    marginTop: 50,
    // Dynamic: color
  },
  messageListContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexGrow: 1,
  },

  // Message styles
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  aiMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginHorizontal: 8,
    elevation: 1,
    // Dynamic: shadowColor
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, // Keep opacity static or adjust based on theme
    shadowRadius: 2,
  },
  userMessageBubble: {
    borderTopRightRadius: 4,
    // Dynamic: backgroundColor
  },
  aiMessageBubble: {
    borderTopLeftRadius: 4,
    // Dynamic: backgroundColor, borderColor, borderWidth
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    // Dynamic: color
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
    opacity: 0.7,
    // Dynamic: color
  },
  messageAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    // Dynamic: borderColor
  },
  messageAvatarContainer: {
      marginBottom: 4,
      marginRight: 8,
  },
  userAvatarPlaceholder: {
    width: 36 + 8, // width + marginRight of AI avatar
  },

  // Typing indicator styles
  typingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    // Dynamic: backgroundColor
  },
  typingIndicatorAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    borderWidth: 1,
    // Dynamic: borderColor
  },
  typingIndicatorText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginRight: 6,
    // Dynamic: color
  },
  typingDot: { // Style for TypingIndicator component
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
    // Dynamic: backgroundColor (passed as prop)
  },

  // Input area styles
  inputAreaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    // Dynamic: backgroundColor, borderTopColor
  },
  textInput: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 120,
    borderWidth: 1, // Keep border static
    // Dynamic: backgroundColor, color, borderColor
  },
  sendButtonContainer: { // Improved send button
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    // Dynamic: backgroundColor
    // Static shadow:
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  sendButtonDisabled: {
    opacity: 0.4, // Consistent disabled state
  },

  // Guest mode styles
  guestModeBanner: {
    padding: 12,
    borderTopWidth: 1,
    // Dynamic: backgroundColor, borderColor
  },
  guestModeText: {
    fontSize: 14,
    textAlign: 'center',
    // Dynamic: color
  },
  guestModeUpgradeLink: {
    fontWeight: '600',
    // Dynamic: color
  },

  // Theme selector styles
  themeModalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    // Dynamic: backgroundColor
  },
  themeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    // Dynamic: borderBottomColor
    borderBottomWidth: 1, // Keep border static
  },
  themeModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    // Dynamic: color
  },
  themeCloseButton: { // Style for the close button
    padding: 8, // Adequate touch area
  },
  themeListContainer: {
    paddingVertical: 8,
  },
  themeItemContainer: {
    marginRight: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    padding: 8,
    width: 100,
    // Dynamic: borderColor
  },
  themeItemSelected: {
     // This style is now mainly for semantic grouping,
     // dynamic border color is applied inline in JSX
  },
  themePreviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)', // Static light border
    // Dynamic: backgroundColor
  },
  themeNameText: {
    fontSize: 14,
    fontWeight: '500',
    // Dynamic: color
  },
});

// --- Typing Indicator Component (Defined after styles) ---
const TypingIndicator = ({ color }: { color: string }) => {
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
  }, [yAnims]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {yAnims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[ styles.typingDot, { backgroundColor: color, transform: [{ translateY: anim }] } ]}
        />
      ))}
    </View>
  );
};

// --- Main Chat Screen Component ---
export default function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { character: routeCharacter } = route.params || {};

  const character = useMemo(() => ({
    ...routeCharacter,
    id: Number(routeCharacter?.id || 0),
    name: routeCharacter?.name || 'AI Assistant',
    avatar: routeCharacter?.avatar || routeCharacter?.image_url || require('../assets/char1.png'),
    greeting: routeCharacter?.greeting || routeCharacter?.openingMessage,
  }), [routeCharacter]);

  const { user, isGuest, incrementGuestMessageCount, shouldShowSubscriptionOffer } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [selectedTheme, setSelectedTheme] = useState(CHAT_THEMES[0]);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const animationRefs = useRef(new Map<string | number, { fadeAnim: Animated.Value; slideAnim: Animated.Value; scaleAnim: Animated.Value; }>());
  const closeButtonTimeoutRef = useRef<NodeJS.Timeout>();

  // --- Dynamic Colors (Defined inside component) ---
  const colors = {
    background: isDarkMode ? '#121212' : '#F8FAFC',
    inputBackground: isDarkMode ? '#1E293B' : '#F1F5F9',
    text: isDarkMode ? '#E5E7EB' : '#1E293B',
    subText: isDarkMode ? '#94A3B8' : '#64748B',
    userBubble: isDarkMode ? '#4F46E5' : '#38BDF8',
    aiBubble: isDarkMode ? '#1E293B' : '#FFFFFF',
    aiBubbleShadow: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
    userText: '#FFFFFF',
    aiText: isDarkMode ? '#FFFFFF' : '#1E293B',
    border: isDarkMode ? '#1E293B' : '#E2E8F0',
    sendButton: isDarkMode ? '#4F46E5' : '#3B82F6',
    primary: isDarkMode ? '#4F46E5' : '#3B82F6',
    secondary: '#8B5CF6',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    accent: isDarkMode ? '#818CF8' : '#93C5FD',
    userIconColor: isDarkMode ? '#818CF8' : '#3B82F6',
    avatarBorder: isDarkMode ? '#4F46E5' : '#FFFFFF',
    messageTimestamp: isDarkMode ? '#64748B' : '#94A3B8',
  };

  // --- Helper Functions ---
  const mapDbMessageToUIMessage = (dbMsg: DbMessage): UIMessage => ({
    id: dbMsg.id ?? Crypto.randomUUID(),
    text: dbMsg.content ?? '[empty message]',
    sender: (dbMsg.sender ?? 'ai') as 'user' | 'ai',
    timestamp: dbMsg.created_at ? new Date(dbMsg.created_at).getTime() : Date.now(),
  });

  const generateWelcomeMessage = (char: Character) => {
    if (char.greeting) return char.greeting;
    if (char.openingMessage) {
       const questionList = (char.exampleQuestions || []).map((q: string) => `• ${q}`).join('\n');
       return `${char.openingMessage}${questionList ? `\n\nHere are some things I can help with:\n${questionList}` : ''}`;
    }
    return `Hello! I'm ${char.name}. How can I help you today?`;
  };

  const createMessageAnimation = (messageId: string | number) => {
    const fadeAnim = new Animated.Value(0);
    const slideAnim = new Animated.Value(20);
    const scaleAnim = new Animated.Value(0.9);
    animationRefs.current.set(messageId, { fadeAnim, slideAnim, scaleAnim });
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: MESSAGE_ANIMATION_DURATION, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  };

  const fetchAIResponse = async (userInput: string, chatHistory: { role: 'user' | 'assistant'; content: string }[], char: Character): Promise<string> => {
     const characterContext = `You are ${char.name}. ${char.description || ''}. You embody the following traits: ${(char.tags || []).join(', ')}. Respond in character. Keep responses conversational and engaging.`;
     const apiMessages = [{ role: 'system', content: characterContext }, ...chatHistory, { role: 'user', content: userInput }];
     try {
       const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': 'Bearer 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', // Replace with secure handling
           'HTTP-Referer': 'https://fantasyai.app',
           'X-Title': 'Fantasy AI Chat'
         },
         body: JSON.stringify({ model: 'deepseek/deepseek-coder', messages: apiMessages, temperature: 0.7, max_tokens: 1024 }),
       });
       if (!response.ok) { const errorData = await response.json(); console.error('OpenRouter API error:', errorData); throw new Error(`API error: ${response.status}`); }
       const data = await response.json();
       return data.choices[0].message.content.trim();
     } catch (error) {
        console.error('Error calling OpenRouter API:', error);
        const defaultResponses = ["Hmm, let me think...", "That's interesting!", "Could you tell me more?"];
        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
     }
   };

   const updateGuestChatSession = async (lastMessageText: string) => {
     if (!isGuest || isNaN(character.id) || character.id <= 0) return;
     try {
       const now = new Date().toISOString();
       const currentChatsRaw = await AsyncStorage.getItem(GUEST_CHATS_STORAGE_KEY);
       let currentChats: GuestChatSessionData[] = currentChatsRaw ? JSON.parse(currentChatsRaw) : [];
       if (!Array.isArray(currentChats)) currentChats = [];
       const existingIndex = currentChats.findIndex(chat => chat.characterId === character.id);
       const sessionData: GuestChatSessionData = { id: character.id, characterId: character.id, name: character.name, avatar: null, lastMessage: lastMessageText.substring(0, 100), lastInteractionAt: now };
       if (existingIndex > -1) { currentChats[existingIndex] = sessionData; } else { currentChats.push(sessionData); }
       currentChats.sort((a, b) => new Date(b.lastInteractionAt).getTime() - new Date(a.lastInteractionAt).getTime());
       const limitedChats = currentChats.slice(0, 15);
       await AsyncStorage.setItem(GUEST_CHATS_STORAGE_KEY, JSON.stringify(limitedChats));
     } catch (error) { console.error("Error updating guest chat session:", error); }
   };

  // --- Effects ---
  useEffect(() => { // Load initial messages
    const loadMessages = async () => {
      if (!character?.id) return;
      setLoading(true); setInitialLoadComplete(false); let initialMessages: UIMessage[] = [];
      if (user && !isGuest) {
        try {
          if (isNaN(character.id) || character.id <= 0) { console.error("Invalid character ID:", character.id); throw new Error("Invalid character ID"); }
          const dbMessages = await getChatMessages(user.id, character.id); initialMessages = dbMessages.map(mapDbMessageToUIMessage);
        } catch (error) { console.error('Error loading messages:', error); Alert.alert('Error', 'Failed to load chat history.'); }
      }
      if (initialMessages.length === 0) { const welcomeMessage = generateWelcomeMessage(character); initialMessages.push({ id: Crypto.randomUUID(), text: welcomeMessage, sender: 'ai', timestamp: Date.now() }); }
      setMessages(initialMessages); setLoading(false); setInitialLoadComplete(true);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    };
    loadMessages();
  }, [user, isGuest, character?.id]);

  useEffect(() => { // Real-time subscription
    if (user && !isGuest && character?.id && !isNaN(character.id) && character.id > 0) {
      const channel = subscribeToNewMessages(user.id, character.id, (newMessage) => {
        setMessages((prev) => prev.some(msg => msg.id === newMessage.id) ? prev : [...prev, mapDbMessageToUIMessage(newMessage)]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      });
      subscriptionRef.current = channel;
      return () => { if (subscriptionRef.current) { unsubscribeFromChat(subscriptionRef.current); subscriptionRef.current = null; } };
    } else { if (subscriptionRef.current) { unsubscribeFromChat(subscriptionRef.current); subscriptionRef.current = null; } }
  }, [user, isGuest, character?.id]);

  useEffect(() => { // Cleanup close button timeout
     return () => { if (closeButtonTimeoutRef.current) clearTimeout(closeButtonTimeoutRef.current); };
   }, []);

  // --- Event Handlers ---
  const handleSend = async () => {
    if (!inputText.trim() || isAISpeaking) return;
    if (isNaN(character.id) || character.id <= 0) { Alert.alert("Error", "Cannot send message: Invalid character data."); return; }
    const userMessageText = inputText.trim(); setInputText(''); Keyboard.dismiss();
    const optimisticUserMessage: UIMessage = { id: Crypto.randomUUID(), text: userMessageText, sender: 'user', timestamp: Date.now() };
    setMessages(prev => [...prev, optimisticUserMessage]); createMessageAnimation(optimisticUserMessage.id);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    if (isGuest) {
      await incrementGuestMessageCount(); await updateGuestChatSession(userMessageText);
      const shouldShowOffer = await shouldShowSubscriptionOffer();
      if (shouldShowOffer) { navigation.navigate('DiscountOfferScreen', { fromCharacter: true }); return; }
    }

    let savedUserMessage: DbMessage | null = null;
    if (user && !isGuest) {
      try {
        savedUserMessage = await sendMessageToDb(user.id, character.id, userMessageText, 'user');
        if (savedUserMessage) setMessages(prev => prev.map(msg => msg.id === optimisticUserMessage.id ? { ...msg, id: savedUserMessage!.id } : msg));
      } catch (error) { console.error('Error saving user message:', error); Alert.alert('Error', 'Failed to send message.'); setMessages(prev => prev.filter(msg => msg.id !== optimisticUserMessage.id)); return; }
    }

    setIsAISpeaking(true);
    try {
      const historyForAI = messages.filter(msg => msg.id !== optimisticUserMessage.id).map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text } as {role: 'user' | 'assistant', content: string}));
      const aiResponseText = await fetchAIResponse(userMessageText, historyForAI, character);
      const optimisticAIMessage: UIMessage = { id: Crypto.randomUUID(), text: aiResponseText, sender: 'ai', timestamp: Date.now() };
      setMessages(prev => [...prev, optimisticAIMessage]); createMessageAnimation(optimisticAIMessage.id);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      if (user && !isGuest) {
        try {
          const savedAIMessage = await sendMessageToDb(user.id, character.id, aiResponseText, 'ai');
          if (savedAIMessage) setMessages(prev => prev.map(msg => msg.id === optimisticAIMessage.id ? { ...msg, id: savedAIMessage!.id } : msg));
        } catch (error) { console.error('Error saving AI message:', error); }
      }
      if (isGuest) await updateGuestChatSession(aiResponseText);
    } catch (error) {
      console.error('Error fetching AI response:', error); Alert.alert('Error', 'AI failed to respond.');
      setMessages(prev => [...prev, { id: Crypto.randomUUID(), text: "Sorry, I couldn't generate a response.", sender: 'ai', timestamp: Date.now() }]);
    } finally { setIsAISpeaking(false); }
  };

  const handlePressInSend = () => Animated.spring(sendButtonScale, { toValue: 0.85, useNativeDriver: true }).start();
  const handlePressOutSend = () => Animated.spring(sendButtonScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  const handleBack = () => navigation.navigate('MainTabs');

  // --- Render Functions ---
  const renderMessage = useCallback(({ item }: { item: UIMessage }) => {
    const isUser = item.sender === 'user';
    if (!animationRefs.current.has(item.id)) createMessageAnimation(item.id);
    const messageAnimation = animationRefs.current.get(item.id)!;
    const formattedTime = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let avatarSource = require('../assets/profile-placeholder.png');
    if (!isUser && character?.avatar) {
      if (typeof character.avatar === 'number') avatarSource = character.avatar;
      else if (typeof character.avatar === 'string' && character.avatar.startsWith('http')) avatarSource = { uri: character.avatar };
      else if (typeof character.avatar === 'string') avatarSource = { uri: character.avatar }; // Attempt URI
    }
    return (
      <Animated.View key={item.id.toString()} style={[ styles.messageRow, isUser ? styles.userMessageRow : styles.aiMessageRow, { opacity: messageAnimation.fadeAnim, transform: [ { translateY: messageAnimation.slideAnim }, { scale: messageAnimation.scaleAnim } ] } ]}>
        {!isUser && (<View style={styles.messageAvatarContainer}><Image source={avatarSource} style={[styles.messageAvatar, { borderColor: colors.avatarBorder }]} onError={(e) => console.warn("AI avatar error:", e.nativeEvent.error)} /></View>)}
        <View style={[ styles.messageBubble, isUser ? styles.userMessageBubble : styles.aiMessageBubble, isUser ? { backgroundColor: colors.userBubble } : { backgroundColor: colors.aiBubble, borderColor: colors.border, borderWidth: isDarkMode ? 0 : 1 }, { shadowColor: colors.aiBubbleShadow } ]}>
          <Text style={[styles.messageText, { color: isUser ? colors.userText : colors.aiText }]}>{item.text}</Text>
          <Text style={[styles.timestamp, { color: isUser ? 'rgba(255, 255, 255, 0.7)' : colors.messageTimestamp }]}>{formattedTime}</Text>
        </View>
        {isUser && <View style={styles.userAvatarPlaceholder} />}
      </Animated.View>
    );
  }, [isDarkMode, character, colors]); // Include colors

  const renderThemeSelector = () => (
    <Modal visible={showThemeSelector} transparent={true} animationType="slide" onRequestClose={() => setShowThemeSelector(false)}>
      <View style={[styles.themeModalContainer, { backgroundColor: colors.card }]}>
        <View style={[styles.themeModalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.themeModalTitle, { color: colors.text }]}>Chat Background</Text>
          <Pressable onPress={() => setShowThemeSelector(false)} style={({ pressed }) => [ styles.themeCloseButton, { opacity: pressed ? 0.6 : 1 } ]}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>
        <FlatList
          data={CHAT_THEMES} horizontal showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [ styles.themeItemContainer, { borderColor: selectedTheme.id === item.id ? colors.primary : colors.border, transform: [{ scale: pressed ? 0.97 : 1 }], opacity: pressed ? 0.8 : 1, } ]}
              onPress={() => { setSelectedTheme(item); setShowThemeSelector(false); }}
            >
              {item.background ? (<Image source={item.background} style={styles.themePreviewImage} />) : (<View style={[styles.themePreviewImage, { backgroundColor: colors.background }]} />)}
              <Text style={[styles.themeNameText, { color: colors.text }]}>{item.name}</Text>
            </Pressable>
          )}
          keyExtractor={(item) => item.id} contentContainerStyle={styles.themeListContainer}
        />
      </View>
    </Modal>
  );

  // --- Main Render ---
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
         {/* Header */}
         <View style={[styles.headerContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
           <Pressable style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.5 : 1 }]} onPress={handleBack}>
             <Ionicons name="chevron-back" size={28} color={colors.text} />
           </Pressable>
           <View style={styles.headerCenterContent}>
              <Image source={ character?.avatar ? typeof character.avatar === 'number' ? character.avatar : typeof character.avatar === 'string' && character.avatar.startsWith('http') ? { uri: character.avatar } : require('../assets/profile-placeholder.png') : require('../assets/profile-placeholder.png') } style={[styles.headerAvatar, { borderColor: colors.avatarBorder }]} onError={(e) => console.warn("Header avatar error:", e.nativeEvent.error)} />
             <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{character?.name || 'Chat'}</Text>
           </View>
           <Pressable style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.5 : 1 }]} onPress={() => setShowThemeSelector(true)}>
             <Ionicons name="color-palette-outline" size={26} color={colors.text} />
           </Pressable>
         </View>
        {/* Chat Area */}
        <ImageBackground source={selectedTheme.background} style={styles.chatAreaContainer} imageStyle={styles.chatBackgroundImage}>
          {loading && !initialLoadComplete && (<ActivityIndicator size="large" color={colors.primary} style={styles.loadingIndicator} />)}
          <FlatList ref={flatListRef} data={messages} renderItem={renderMessage} keyExtractor={(item) => item.id.toString()} contentContainerStyle={styles.messageListContent} onContentSizeChange={() => initialLoadComplete && flatListRef.current?.scrollToEnd({ animated: true })} onLayout={() => initialLoadComplete && flatListRef.current?.scrollToEnd({ animated: false })} showsVerticalScrollIndicator={false} />
        </ImageBackground>
        {/* Typing Indicator */}
        {isAISpeaking && (
          <View style={[styles.typingIndicatorContainer, { backgroundColor: colors.background }]}>
             <Image source={ character?.avatar ? typeof character.avatar === 'number' ? character.avatar : typeof character.avatar === 'string' && character.avatar.startsWith('http') ? { uri: character.avatar } : require('../assets/profile-placeholder.png') : require('../assets/profile-placeholder.png') } style={[styles.typingIndicatorAvatar, { borderColor: colors.avatarBorder }]} onError={(e) => console.warn("Typing indicator avatar error:", e.nativeEvent.error)} />
            <Text style={[styles.typingIndicatorText, { color: colors.subText }]}>{character?.name || 'AI'} is typing{' '}</Text>
            <TypingIndicator color={colors.subText} />
          </View>
        )}
        {/* Input Area */}
        <View style={[styles.inputAreaContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput style={[ styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border, } ]} placeholder="Type a message..." placeholderTextColor={colors.subText} value={inputText} onChangeText={setInputText} multiline />
          <Pressable onPress={handleSend} onPressIn={handlePressInSend} onPressOut={handlePressOutSend} disabled={!inputText.trim() || isAISpeaking} style={({ pressed }) => [ styles.sendButtonContainer, { backgroundColor: colors.sendButton }, (!inputText.trim() || isAISpeaking) && styles.sendButtonDisabled, ]}>
            <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
              {isAISpeaking ? (<ActivityIndicator size="small" color="#FFFFFF" />) : (<Ionicons name="send" size={20} color="#FFFFFF" style={{ marginLeft: 2 }}/>)}
            </Animated.View>
          </Pressable>
        </View>
        {/* Guest Banner */}
        {isGuest && (
          <View style={[styles.guestModeBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.guestModeText, { color: colors.text }]}>You're using a guest account with limited messages.{' '}
              <Text style={[styles.guestModeUpgradeLink, { color: colors.primary }]} onPress={() => navigation.navigate('SubscriptionScreen', { isSpecialOffer: false })}>Upgrade now</Text>
            </Text>
          </View>
        )}
        {renderThemeSelector()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
