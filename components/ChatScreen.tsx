import React, { useState, useEffect, useRef, useContext, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
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
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RealtimeChannel } from '@supabase/supabase-js'; // Import RealtimeChannel
import {
  getChatMessages, // New function
  sendMessage as sendMessageToDb, // New function (aliased)
  subscribeToNewMessages, // New function
  unsubscribeFromChat, // New function
  Message as DbMessage // Type from service (matches DB) - Ensure this is exported from service
} from '../services/conversationService';
// Removed recordCharacterInteraction, assuming it's handled elsewhere or not needed now
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Type for storing guest chat sessions locally (remains the same for now)
type GuestChatSessionData = {
  id: number; // Use characterId (number)
  characterId: number;
  // conversationId: string; // No longer needed
  name: string;
  avatar: string | number | null;
  lastMessage: string;
  lastInteractionAt: string;
};

const GUEST_CHATS_STORAGE_KEY = 'guestChats';

// Define navigation types for this component
type RootStackParamList = {
  Login: undefined;
  EmailSignIn: { isSignUp?: boolean };
  MainTabs: undefined;
  Onboarding: undefined;
  Chat: { character: Character }; // Use updated Character interface
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

// Local Message type for UI state
type UIMessage = {
  id: string | number; // Can be DB id (number) or UUID (string) for local messages
  text: string;
  sender: 'user' | 'ai';
  timestamp: number; // Use JS timestamp for UI sorting/display
};

// Character interface matching expected route params and DB structure
interface Character {
  id: number; // Changed to number to match DB schema (BIGINT)
  name: string;
  description?: string;
  avatar: any; // Keep flexible for require/uri
  tags?: string[];
  category?: string;
  openingMessage?: string;
  exampleQuestions?: string[];
  greeting?: string; // Added from schema
  image_url?: string; // Added from schema
}


const TYPING_INDICATORS = [
  'is typing',
  'is typing.',
  'is typing..',
  'is typing...',
];

const CHAT_THEMES = [
  { id: 'default', name: 'Default', background: null },
  { id: 'gradient1', name: 'Sunset', background: require('../assets/chat-bg/gradient1.png') },
  { id: 'gradient2', name: 'Ocean', background: require('../assets/chat-bg/gradient2.png') },
  { id: 'pattern1', name: 'Bubbles', background: require('../assets/chat-bg/pattern1.png') },
  { id: 'pattern2', name: 'Stars', background: require('../assets/chat-bg/pattern2.png') },
];

const MESSAGE_ANIMATION_DURATION = 300;

interface ChatScreenProps {
  route: {
    params: {
      character: Character;
      // conversationId?: string; // Removed
    };
  };
  navigation: NavigationProp;
}

export default function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { character: routeCharacter } = route.params || {};

  // Ensure character ID is treated as a number
  const character = useMemo(() => ({
    ...routeCharacter,
    id: Number(routeCharacter?.id || 0), // Ensure ID is a number
    name: routeCharacter?.name || 'AI Assistant',
    avatar: routeCharacter?.avatar || routeCharacter?.image_url || require('../assets/char1.png'), // Use image_url as fallback
    greeting: routeCharacter?.greeting || routeCharacter?.openingMessage, // Use greeting from schema
  }), [routeCharacter]);

  const { user, isGuest, incrementGuestMessageCount, shouldShowSubscriptionOffer } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  const [messages, setMessages] = useState<UIMessage[]>([]); // Use UIMessage for state
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false); // For initial load and AI response
  const [isAISpeaking, setIsAISpeaking] = useState(false); // Separate state for AI typing indicator
  const [typingIndicator, setTypingIndicator] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [selectedTheme, setSelectedTheme] = useState(CHAT_THEMES[0]);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  // const [conversationId, setConversationId] = useState<string | null>(null); // Removed
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const subscriptionRef = useRef<RealtimeChannel | null>(null); // Ref to hold the subscription

  // --- Dynamic Colors (Keep as is) ---
  const colors = {
    background: isDarkMode ? '#121212' : '#F8FAFC',
    inputBackground: isDarkMode ? '#1E293B' : '#F1F5F9',
    text: isDarkMode ? '#E5E7EB' : '#1E293B',
    subText: isDarkMode ? '#94A3B8' : '#64748B',
    userBubble: isDarkMode ? '#4F46E5' : '#38BDF8',
    aiBubble: isDarkMode ? '#1E293B' : '#FFFFFF',
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
  };

  // --- Map DB Message to UI Message ---
  const mapDbMessageToUIMessage = (dbMsg: DbMessage): UIMessage => ({
    // Ensure required fields exist, provide defaults if necessary
    id: dbMsg.id ?? Crypto.randomUUID(), // Use DB id or generate local if null (shouldn't happen with SERIAL PK)
    text: dbMsg.content ?? '[empty message]', // Provide fallback for null content
    sender: (dbMsg.sender ?? 'ai') as 'user' | 'ai', // Default to 'ai' if sender is null
    // Handle potentially null created_at before passing to Date constructor
    timestamp: dbMsg.created_at ? new Date(dbMsg.created_at).getTime() : Date.now(),
  });


  // --- Load Initial Messages ---
  useEffect(() => {
    const loadMessages = async () => {
      if (!character?.id) return; // Need character ID

      setLoading(true);
      setInitialLoadComplete(false);

      let initialMessages: UIMessage[] = [];

      if (user && !isGuest) {
        try {
          // Ensure character.id is a valid number before calling
          if (isNaN(character.id) || character.id <= 0) {
             console.error("Invalid character ID for loading messages:", character.id);
             throw new Error("Invalid character ID");
          }
          const dbMessages = await getChatMessages(user.id, character.id);
          initialMessages = dbMessages.map(mapDbMessageToUIMessage);
        } catch (error) {
          console.error('Error loading initial messages:', error);
          Alert.alert('Error', 'Failed to load chat history.');
        }
      }

      // Add welcome message if no history exists
      if (initialMessages.length === 0) {
        const welcomeMessage = generateWelcomeMessage(character);
        initialMessages.push({
          id: Crypto.randomUUID(), // Local ID for welcome message
          text: welcomeMessage,
          sender: 'ai',
          timestamp: Date.now(),
        });
      }

      setMessages(initialMessages);
      setLoading(false);
      setInitialLoadComplete(true);
      // Scroll to bottom after initial load
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    };

    loadMessages();
  }, [user, isGuest, character?.id]); // Depend on user and character ID

  // --- Real-time Subscription ---
  useEffect(() => {
    // Ensure character.id is a valid number before subscribing
    if (user && !isGuest && character?.id && !isNaN(character.id) && character.id > 0) {
      // Subscribe to new messages for this specific chat
      const channel = subscribeToNewMessages(user.id, character.id, (newMessage) => {
        // Avoid adding duplicates if message was just sent by this client
        setMessages((prevMessages) => {
          if (!prevMessages.some(msg => msg.id === newMessage.id)) {
            return [...prevMessages, mapDbMessageToUIMessage(newMessage)];
          }
          return prevMessages;
        });
        // Scroll down when new message arrives
         setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      });
      subscriptionRef.current = channel;

      // Cleanup: Unsubscribe when component unmounts or user/character changes
      return () => {
        if (subscriptionRef.current) {
          unsubscribeFromChat(subscriptionRef.current);
          subscriptionRef.current = null;
        }
      };
    } else {
      // Ensure cleanup if user logs out or character changes while subscribed
       if (subscriptionRef.current) {
          unsubscribeFromChat(subscriptionRef.current);
          subscriptionRef.current = null;
        }
    }
  }, [user, isGuest, character?.id]); // Re-subscribe if user or character changes

  // --- Typing indicator animation (Keep as is) ---
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (isAISpeaking) { // Use isAISpeaking state
      intervalId = setInterval(() => {
        setTypingIndicator((prev) => (prev + 1) % TYPING_INDICATORS.length);
      }, 500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAISpeaking]); // Depend on isAISpeaking

  // --- Close Button Timeout Cleanup (Keep as is) ---
   const closeButtonTimeoutRef = useRef<NodeJS.Timeout>();
   useEffect(() => {
     return () => {
       if (closeButtonTimeoutRef.current) {
         clearTimeout(closeButtonTimeoutRef.current);
       }
     };
   }, []);

  // --- Animation Refs (Keep as is) ---
  const animationRefs = useRef(new Map<string | number, {
    fadeAnim: Animated.Value;
    slideAnim: Animated.Value;
  }>());

  // --- Generate Welcome Message (Adjusted) ---
  const generateWelcomeMessage = (character: Character) => {
    // Prioritize greeting from DB schema
    if (character.greeting) {
      return character.greeting;
    }
    // Fallback to openingMessage or default
    if (character.openingMessage) {
       const questionList = (character.exampleQuestions || [])
         .map((q: string) => `• ${q}`)
         .join('\n');
       return `${character.openingMessage}${questionList ? `\n\nHere are some things I can help with:\n${questionList}` : ''}`;
    }
    // Generic fallback
    return `Hello! I'm ${character.name}. How can I help you today?`;
  };


  // --- Handle Send Message ---
  const handleSend = async () => {
    if (!inputText.trim() || isAISpeaking) return; // Prevent sending while AI is typing

    // Ensure character ID is valid before proceeding
    if (isNaN(character.id) || character.id <= 0) {
       console.error("Cannot send message, invalid character ID:", character.id);
       Alert.alert("Error", "Cannot send message due to invalid character data.");
       return;
    }


    const userMessageText = inputText.trim();
    setInputText('');
    Keyboard.dismiss(); // Dismiss keyboard

    // 1. Add User Message to UI Optimistically
    const optimisticUserMessage: UIMessage = {
      id: Crypto.randomUUID(), // Temporary local ID
      text: userMessageText,
      sender: 'user',
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, optimisticUserMessage]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);


    // 2. Handle Guest Mode Logic
    if (isGuest) {
      await incrementGuestMessageCount();
      await updateGuestChatSession(userMessageText); // Update preview

      const shouldShowOffer = await shouldShowSubscriptionOffer();
      if (shouldShowOffer) {
        if (closeButtonTimeoutRef.current) clearTimeout(closeButtonTimeoutRef.current);
        setShowCloseButton(false);
        closeButtonTimeoutRef.current = setTimeout(() => setShowCloseButton(true), 5000);
        navigation.navigate('DiscountOfferScreen', { fromCharacter: true });
        return; // Stop processing if offer is shown
      }
      // Continue to fetch AI response for guest, but don't save to DB
    }

    // 3. Save User Message to DB (if logged in)
    let savedUserMessage: DbMessage | null = null;
    if (user && !isGuest) { // Removed character?.id check here as it's validated above
      try {
        savedUserMessage = await sendMessageToDb(
          user.id,
          character.id, // Already validated
          userMessageText,
          'user'
        );
        // Optionally update the optimistic message ID with the real DB ID
        if (savedUserMessage) {
           setMessages(prev => prev.map(msg =>
             msg.id === optimisticUserMessage.id ? { ...msg, id: savedUserMessage!.id } : msg
           ));
        }
      } catch (error) {
        console.error('Error saving user message:', error);
        // Optionally revert optimistic update or show error to user
         Alert.alert('Error', 'Failed to send message. Please try again.');
         setMessages(prev => prev.filter(msg => msg.id !== optimisticUserMessage.id)); // Revert optimistic
         return; // Stop processing on error
      }
    }

    // 4. Fetch AI Response
    setIsAISpeaking(true); // Show typing indicator
    try {
      // Prepare history for AI (use current state, potentially excluding optimistic message)
      const historyForAI = messages
         .filter(msg => msg.id !== optimisticUserMessage.id) // Exclude optimistic user message if not saved yet
         .map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text } as {role: 'user' | 'assistant', content: string}));

      const aiResponseText = await fetchAIResponse(userMessageText, historyForAI, character);

      // 5. Add AI Message to UI Optimistically
      const optimisticAIMessage: UIMessage = {
        id: Crypto.randomUUID(), // Temporary local ID
        text: aiResponseText,
        sender: 'ai',
        timestamp: Date.now(),
      };
       setMessages(prev => [...prev, optimisticAIMessage]);
       setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);


      // 6. Save AI Message to DB (if logged in)
      if (user && !isGuest) { // Removed character?.id check here
        try {
          const savedAIMessage = await sendMessageToDb(
            user.id,
            character.id, // Already validated
            aiResponseText,
            'ai'
          );
           // Optionally update the optimistic message ID with the real DB ID
           if (savedAIMessage) {
             setMessages(prev => prev.map(msg =>
               msg.id === optimisticAIMessage.id ? { ...msg, id: savedAIMessage!.id } : msg
             ));
           }
        } catch (error) {
          console.error('Error saving AI message:', error);
          // Handle error - maybe show indicator on AI message
        }
      }

       // Update guest session preview if applicable
       if (isGuest) {
         await updateGuestChatSession(aiResponseText);
       }

    } catch (error) {
      console.error('Error fetching AI response:', error);
      Alert.alert('Error', 'AI failed to respond. Please try again.');
      // Optionally add an error message to the chat UI
       setMessages(prev => [...prev, {
         id: Crypto.randomUUID(),
         text: "Sorry, I couldn't generate a response right now.",
         sender: 'ai',
         timestamp: Date.now()
       }]);
    } finally {
      setIsAISpeaking(false); // Hide typing indicator
    }
  };


  // --- Update Guest Chat Session (Adjusted) ---
  const updateGuestChatSession = async (lastMessageText: string) => {
     // Ensure character ID is valid before proceeding
     if (!isGuest || isNaN(character.id) || character.id <= 0) return;

    try {
      const now = new Date().toISOString();
      const currentChatsRaw = await AsyncStorage.getItem(GUEST_CHATS_STORAGE_KEY);
      let currentChats: GuestChatSessionData[] = currentChatsRaw ? JSON.parse(currentChatsRaw) : [];
      if (!Array.isArray(currentChats)) currentChats = []; // Ensure it's an array

      const existingIndex = currentChats.findIndex(chat => chat.characterId === character.id);
      const sessionData: GuestChatSessionData = {
        id: character.id, // Use characterId as unique ID
        characterId: character.id,
        name: character.name,
        avatar: null, // Cannot serialize require() results
        lastMessage: lastMessageText.substring(0, 100),
        lastInteractionAt: now,
      };

      if (existingIndex > -1) {
        currentChats[existingIndex] = sessionData;
      } else {
        currentChats.push(sessionData);
      }

      currentChats.sort((a, b) => new Date(b.lastInteractionAt).getTime() - new Date(a.lastInteractionAt).getTime());
      const limitedChats = currentChats.slice(0, 15);

      await AsyncStorage.setItem(GUEST_CHATS_STORAGE_KEY, JSON.stringify(limitedChats));
    } catch (error) {
      console.error("Error updating guest chat session:", error);
    }
  };

  // --- Fetch AI Response (Keep as is, but ensure history format is correct) ---
   const fetchAIResponse = async (
     userInput: string,
     // Ensure history passed here is correctly formatted { role: 'user' | 'assistant', content: string }[]
     chatHistory: { role: 'user' | 'assistant'; content: string }[],
     character: Character
   ): Promise<string> => {
     const characterContext = `You are ${character.name}. ${character.description || ''}. You embody the following traits: ${(character.tags || []).join(', ')}. Respond in character. Keep responses conversational and engaging.`;

     const apiMessages = [
       { role: 'system', content: characterContext },
       ...chatHistory, // Pass the pre-formatted history
       { role: 'user', content: userInput },
     ];

     try {
       // --- API Call Logic (Keep as is) ---
       const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': 'Bearer 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', // Replace with secure handling
           'HTTP-Referer': 'https://fantasyai.app', // Replace if needed
           'X-Title': 'Fantasy AI Chat'
         },
         body: JSON.stringify({
           model: 'deepseek/deepseek-coder',
           messages: apiMessages,
           temperature: 0.7,
           max_tokens: 1024,
         }),
       });

       if (!response.ok) {
         const errorData = await response.json();
         console.error('OpenRouter API error:', errorData);
         throw new Error(`API error: ${response.status}`);
       }

       const data = await response.json();
       return data.choices[0].message.content.trim();
     } catch (error) {
        console.error('Error calling OpenRouter API:', error);
        // Fallback response
        const defaultResponses = ["Hmm, let me think...", "That's interesting!", "Could you tell me more?"];
        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
     }
   };

  // --- Render Message (Adjusted for UIMessage type) ---
  const renderMessage = useCallback(({ item }: { item: UIMessage }) => {
    const isUser = item.sender === 'user';

    // Animation logic (keep as is, using item.id which can be string or number)
    if (!animationRefs.current.has(item.id)) {
      const fadeAnim = new Animated.Value(0);
      const slideAnim = new Animated.Value(isUser ? 50 : -50);
      animationRefs.current.set(item.id, { fadeAnim, slideAnim });
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: MESSAGE_ANIMATION_DURATION, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: MESSAGE_ANIMATION_DURATION, useNativeDriver: true }),
      ]).start();
    }
    const messageAnimation = animationRefs.current.get(item.id) || { fadeAnim: new Animated.Value(1), slideAnim: new Animated.Value(0) };

    const messageDate = new Date(item.timestamp);
    const formattedTime = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Determine avatar source carefully
    let avatarSource = require('../assets/profile-placeholder.png'); // Default placeholder
     if (!isUser && character?.avatar) {
       if (typeof character.avatar === 'number') { // Handle require() case
         avatarSource = character.avatar;
       } else if (typeof character.avatar === 'string' && character.avatar.startsWith('http')) { // Handle URI case
         avatarSource = { uri: character.avatar };
       } else if (typeof character.avatar === 'string') { // Handle potential relative path or invalid string
          console.warn("Character avatar is a string but not a URI:", character.avatar);
          // Attempt to use it as URI, might fail if it's not a valid image URL
          avatarSource = { uri: character.avatar };
       }
     }


    return (
      <Animated.View
        key={item.id.toString()} // Ensure key is string
        style={[
          styles.messageRow,
          isUser ? styles.userMessageRow : styles.aiMessageRow,
          { opacity: messageAnimation.fadeAnim, transform: [{ translateY: messageAnimation.slideAnim }] },
        ]}
      >
        {!isUser && (
          <Image
            source={avatarSource} // Use determined source
            style={[styles.messageAvatar, { borderColor: colors.avatarBorder }]}
            onError={(e) => console.warn("Error loading AI avatar:", e.nativeEvent.error)} // Add error handling
          />
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userMessageBubble : styles.aiMessageBubble,
            isUser ? { backgroundColor: colors.userBubble } : { backgroundColor: colors.aiBubble, borderColor: colors.border, borderWidth: isDarkMode ? 0 : 1 },
          ]}
        >
          <Text style={[styles.messageText, { color: isUser ? colors.userText : colors.aiText }]}>
            {item.text}
          </Text>
          <Text style={[styles.messageTime, { color: isUser ? 'rgba(255, 255, 255, 0.7)' : colors.subText }]}>
            {formattedTime}
          </Text>
        </View>
        {isUser && <View style={styles.userAvatarPlaceholder} />}
      </Animated.View>
    );
  }, [isDarkMode, character, colors]); // Include colors

  // --- handleBack (Keep as is) ---
  const handleBack = () => navigation.navigate('MainTabs');

  // --- renderThemeSelector (Keep as is) ---
  const renderThemeSelector = () => (
    <Modal
      visible={showThemeSelector}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowThemeSelector(false)}
    >
      <View style={[styles.themeModalContainer, { backgroundColor: colors.card }]}>
        <View style={styles.themeModalHeader}>
          <Text style={[styles.themeModalTitle, { color: colors.text }]}>Chat Background</Text>
          <TouchableOpacity onPress={() => setShowThemeSelector(false)}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={CHAT_THEMES}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.themeItemContainer,
                selectedTheme.id === item.id && styles.themeItemSelected,
                { borderColor: selectedTheme.id === item.id ? colors.primary : colors.border }
              ]}
              onPress={() => { setSelectedTheme(item); setShowThemeSelector(false); }}
            >
              {item.background ? (
                <Image source={item.background} style={styles.themePreviewImage} />
              ) : (
                <View style={[styles.themePreviewImage, { backgroundColor: colors.background }]} />
              )}
              <Text style={[styles.themeNameText, { color: colors.text }]}>{item.name}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.themeListContainer}
        />
      </View>
    </Modal>
  );

  // --- Main Render ---
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header (Adjusted avatar logic) */}
         <View style={[styles.headerContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
           <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
             <Ionicons name="chevron-back" size={28} color={colors.text} />
           </TouchableOpacity>
           <View style={styles.headerCenterContent}>
              {/* Use the same careful avatar source logic as in renderMessage */}
              <Image
                 source={
                   character?.avatar
                     ? typeof character.avatar === 'number'
                       ? character.avatar
                       : typeof character.avatar === 'string' && character.avatar.startsWith('http')
                         ? { uri: character.avatar }
                         : require('../assets/profile-placeholder.png') // Fallback if string is not URI
                     : require('../assets/profile-placeholder.png') // Fallback if avatar is null/undefined
                 }
                 style={[styles.headerAvatar, { borderColor: colors.avatarBorder }]}
                 onError={(e) => console.warn("Error loading header avatar:", e.nativeEvent.error)} // Add error handling
               />
             <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{character?.name || 'Chat'}</Text>
           </View>
           <TouchableOpacity style={styles.headerButton} onPress={() => setShowThemeSelector(true)}>
             <Ionicons name="color-palette-outline" size={26} color={colors.text} />
           </TouchableOpacity>
         </View>

        {/* Chat Area */}
        <ImageBackground
          source={selectedTheme.background}
          style={styles.chatAreaContainer}
          imageStyle={styles.chatBackgroundImage}
        >
          {loading && !initialLoadComplete && ( // Show loading indicator only during initial load
             <ActivityIndicator size="large" color={colors.primary} style={styles.loadingIndicator} />
           )}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()} // Ensure key is string
            contentContainerStyle={styles.messageListContent}
            onContentSizeChange={() => initialLoadComplete && flatListRef.current?.scrollToEnd({ animated: true })} // Scroll on size change after load
            onLayout={() => initialLoadComplete && flatListRef.current?.scrollToEnd({ animated: false })} // Scroll on layout after load
            showsVerticalScrollIndicator={false}
          />
        </ImageBackground>

        {/* Typing Indicator */}
        {isAISpeaking && ( // Use isAISpeaking state
          <View style={[styles.typingIndicatorContainer, { backgroundColor: colors.background }]}>
             {/* Use the same careful avatar source logic as in renderMessage */}
             <Image
               source={
                 character?.avatar
                   ? typeof character.avatar === 'number'
                     ? character.avatar
                     : typeof character.avatar === 'string' && character.avatar.startsWith('http')
                       ? { uri: character.avatar }
                       : require('../assets/profile-placeholder.png') // Fallback if string is not URI
                   : require('../assets/profile-placeholder.png') // Fallback if avatar is null/undefined
               }
               style={[styles.typingIndicatorAvatar, { borderColor: colors.avatarBorder }]}
                onError={(e) => console.warn("Error loading typing indicator avatar:", e.nativeEvent.error)} // Add error handling
             />
            <Text style={[styles.typingIndicatorText, { color: colors.subText }]}>
              {character?.name || 'AI'} {TYPING_INDICATORS[typingIndicator]}
            </Text>
          </View>
        )}

        {/* Input Area */}
        <View style={[styles.inputAreaContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.subText}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButtonContainer,
              { backgroundColor: colors.sendButton },
              (!inputText.trim() || isAISpeaking) && styles.sendButtonDisabled, // Disable while AI speaking
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isAISpeaking} // Disable while AI speaking
          >
            <Ionicons name="send" size={24} color={inputText.trim() ? '#FFFFFF' : colors.subText} />
          </TouchableOpacity>
        </View>

        {/* Guest Banner (Keep as is) */}
        {isGuest && (
          <View style={[styles.guestModeBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.guestModeText, { color: colors.text }]}>
              You're using a guest account with limited messages.{' '}
              <Text
                style={[styles.guestModeUpgradeLink, { color: colors.primary }]}
                onPress={() => navigation.navigate('SubscriptionScreen', { isSpecialOffer: false })}
              >
                Upgrade now
              </Text>
            </Text>
          </View>
        )}
        {renderThemeSelector()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Styles (Keep as is) ---
const styles = StyleSheet.create({
  // ... (styles remain the same)
   container: {
     flex: 1,
   },
   headerContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     paddingHorizontal: 10,
     paddingVertical: 10,
     borderBottomWidth: 1,
     height: 60,
   },
   headerButton: {
     padding: 8,
     minWidth: 40,
     alignItems: 'center',
   },
   headerCenterContent: {
     flex: 1,
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     marginHorizontal: 5,
     overflow: 'hidden', // Prevent title overflow
   },
   headerAvatar: {
     width: 36,
     height: 36,
     borderRadius: 18,
     marginRight: 10,
     borderWidth: 1,
   },
   headerTitle: {
     fontSize: 18,
     fontWeight: '600',
     flexShrink: 1, // Allow title to shrink if needed
   },
   chatAreaContainer: {
     flex: 1,
   },
   chatBackgroundImage: {},
   loadingIndicator: {
     marginTop: 50,
   },
   messageListContent: {
     paddingHorizontal: 16,
     paddingVertical: 20,
     flexGrow: 1,
   },
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
   messageAvatar: {
     width: 36,
     height: 36,
     borderRadius: 18,
     borderWidth: 1,
   },
   userAvatarPlaceholder: {
     width: 36,
     marginRight: 8,
   },
   messageBubble: {
     maxWidth: '75%',
     paddingHorizontal: 14,
     paddingVertical: 10,
     borderRadius: 18,
     marginHorizontal: 8,
     elevation: 1,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.1,
     shadowRadius: 2,
   },
   userMessageBubble: {
     borderTopRightRadius: 4,
   },
   aiMessageBubble: {
     borderTopLeftRadius: 4,
   },
   messageText: {
     fontSize: 16,
     lineHeight: 22,
   },
   messageTime: {
     fontSize: 11,
     marginTop: 4,
     alignSelf: 'flex-end',
     opacity: 0.7,
   },
   typingIndicatorContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 16,
     paddingVertical: 8,
   },
   typingIndicatorAvatar: {
     width: 30,
     height: 30,
     borderRadius: 15,
     marginRight: 8,
     borderWidth: 1,
   },
   typingIndicatorText: {
     fontSize: 14,
     fontStyle: 'italic',
   },
   inputAreaContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     padding: 12,
     borderTopWidth: 1,
   },
   textInput: {
     flex: 1,
     borderRadius: 24,
     paddingHorizontal: 16,
     paddingVertical: Platform.OS === 'ios' ? 12 : 8,
     marginRight: 8,
     fontSize: 16,
     maxHeight: 120,
   },
   sendButtonContainer: {
     width: 48,
     height: 48,
     borderRadius: 24,
     alignItems: 'center',
     justifyContent: 'center',
   },
   sendButtonDisabled: {
     opacity: 0.5,
   },
   guestModeBanner: {
     padding: 12,
     borderTopWidth: 1,
   },
   guestModeText: {
     fontSize: 14,
     textAlign: 'center',
   },
   guestModeUpgradeLink: {
     fontWeight: 'bold',
   },
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
   },
   themeModalHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 16,
   },
   themeModalTitle: {
     fontSize: 18,
     fontWeight: '600',
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
   },
   themeItemSelected: {},
   themePreviewImage: {
     width: 80,
     height: 80,
     borderRadius: 8,
     marginBottom: 8,
     borderWidth: 1,
     borderColor: 'rgba(0,0,0,0.1)',
   },
   themeNameText: {
     fontSize: 14,
     fontWeight: '500',
   },
});