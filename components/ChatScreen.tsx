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
import {
  createConversation,
  getConversation,
  getConversationMessages,
  sendMessage as sendMessageToDb,
  Message as DbMessage
} from '../services/conversationService';
import { recordCharacterInteraction } from '../services/characterService';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

// Type for storing guest chat sessions locally
type GuestChatSessionData = {
  id: string; // Use characterId as the unique ID for guest sessions
  characterId: string;
  conversationId: string; // Can be a generated UUID for guest sessions
  name: string;
  avatar: string | number | null; // Allow null for avatar
  lastMessage: string;
  lastInteractionAt: string; // ISO string timestamp
};

const GUEST_CHATS_STORAGE_KEY = 'guestChats'; // Consistent key

// Define navigation types for this component
// Match the RootStackParamList from App.tsx
type RootStackParamList = {
  Login: undefined;
  EmailSignIn: { isSignUp?: boolean };
  MainTabs: undefined;
  Onboarding: undefined;
  Chat: { character: any };
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

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
};

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

interface Character {
  id: string;
  name: string;
  description?: string;
  avatar: any; // Changed from image to avatar
  tags?: string[];
  category?: string;
  openingMessage?: string;
  exampleQuestions?: string[];
}

interface ChatScreenProps {
  route: {
    params: {
      character: Character;
      conversationId?: string;
    };
  };
  navigation: NavigationProp;
}

export default function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { conversationId: existingConversationId, character: routeCharacter } = route.params || {};

  // Memoize character object to stabilize useEffect dependency
  const character = useMemo(() => ({
    id: routeCharacter?.id || 'default',
    name: routeCharacter?.name || 'AI Assistant',
    avatar: routeCharacter?.avatar || require('../assets/char1.png'),
    description: routeCharacter?.description || '',
    tags: routeCharacter?.tags || [],
    category: routeCharacter?.category || 'default'
  }), [routeCharacter]); // Depend on the character object from route params

  const { user, isGuest, incrementGuestMessageCount, shouldShowSubscriptionOffer } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [selectedTheme, setSelectedTheme] = useState(CHAT_THEMES[0]);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(existingConversationId || null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);

  // Dynamic colors based on theme
  const colors = {
    background: isDarkMode ? '#121212' : '#F8FAFC',
    inputBackground: isDarkMode ? '#1E293B' : '#F1F5F9',
    text: isDarkMode ? '#E5E7EB' : '#1E293B',
    subText: isDarkMode ? '#94A3B8' : '#64748B',
    userBubble: isDarkMode ? '#4F46E5' : '#38BDF8',
    aiBubble: isDarkMode ? '#1E293B' : '#FFFFFF',
    userText: '#FFFFFF', // User text always white
    aiText: isDarkMode ? '#FFFFFF' : '#1E293B', // AI text white in dark mode
    border: isDarkMode ? '#1E293B' : '#E2E8F0',
    sendButton: isDarkMode ? '#4F46E5' : '#3B82F6',
    primary: isDarkMode ? '#4F46E5' : '#3B82F6',
    secondary: '#8B5CF6',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    accent: isDarkMode ? '#818CF8' : '#93C5FD',
    userIconColor: isDarkMode ? '#818CF8' : '#3B82F6',
    avatarBorder: isDarkMode ? '#4F46E5' : '#FFFFFF', // Conditional border for avatar
  };

  // Load conversation and messages
  useEffect(() => {
    const loadConversation = async () => {
      try {
        if (!user && !isGuest) return;

        setLoading(true);

        if (existingConversationId) {
          // Load existing conversation
          const conversation = await getConversation(existingConversationId);
          if (!conversation) throw new Error('Conversation not found');

          // Load messages
          const dbMessages = await getConversationMessages(existingConversationId);

          // Convert DB messages to app format
          const formattedMessages = dbMessages.map(dbMsg => ({
            id: dbMsg.id,
            text: dbMsg.content,
            sender: dbMsg.sender_type === 'user' ? 'user' : 'ai' as 'user' | 'ai',
            timestamp: new Date(dbMsg.created_at).getTime(),
          }));

          setMessages(formattedMessages);
          setConversationId(existingConversationId);
        } else {
          // Create a new conversation if user is logged in
          if (user && !isGuest) {
            const newConversation = await createConversation(
              user.id,
              character.id,
              {
                name: character.name,
                description: character.description,
                image: character.avatar, // Use avatar
                category: character.category,
                tags: character.tags
              }
            );

            if (newConversation) {
              setConversationId(newConversation.id);

              // Add welcome message to database
              const welcomeMessage = generateWelcomeMessage(character);
              await sendMessageToDb(
                newConversation.id,
                'character',
                welcomeMessage,
                { characterId: character.id }
              );

              // Record character interaction
              await recordCharacterInteraction(user.id, character.id);

              // Set initial message in app state
              setMessages([{
                id: Crypto.randomUUID(),
                text: welcomeMessage,
                sender: 'ai',
                timestamp: Date.now(),
              }]);
            }
          } else {
            // For guests, just show the welcome message in memory
            const welcomeMessage = generateWelcomeMessage(character);
            setMessages([{
              id: Crypto.randomUUID(),
              text: welcomeMessage,
              sender: 'ai',
              timestamp: Date.now(),
            }]);
          }
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        Alert.alert('Error', 'Failed to load conversation. Please try again.');
      } finally {
        setLoading(false);
        setInitialLoadComplete(true);
        // Force scroll to bottom after initial load
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };

    loadConversation();
  }, [user, isGuest, existingConversationId, character]);

  // Typing indicator animation
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (loading) {
      intervalId = setInterval(() => {
        setTypingIndicator((prev) => (prev + 1) % TYPING_INDICATORS.length);
      }, 500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loading, TYPING_INDICATORS.length]);

  // Clean up timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (closeButtonTimeoutRef.current) {
        clearTimeout(closeButtonTimeoutRef.current);
      }
    };
  }, []);

  const animationRefs = useRef(new Map<string, {
    fadeAnim: Animated.Value;
    slideAnim: Animated.Value;
  }>());

  const generateWelcomeMessage = (character: Character) => {
    // Use provided opening message if available
    if (character.openingMessage && character.exampleQuestions) {
      const questionList = character.exampleQuestions
        .map((q: string) => `• ${q}`)
        .join('\n');
      return `${character.openingMessage}\n\nHere are some things I can help with:\n${questionList}`;
    }
    
    // Fallback to hyper-specific welcome messages and questions by AI assistant type
    const aiAssistantConfigurations: Record<string, {messages: string[], questions: string[]}> = {
      'finance-analyst': {
        messages: [
          `Hello! I'm ${character.name}, your AI financial expert assistant. ${character.description}`,
          `I'm ${character.name}, your personal AI-powered financial assistant ready to help.`,
          `Welcome to your financial command center with ${character.name}, your AI assistant. ${character.description}`
        ],
        questions: [
          "How can I start investing with $100?",
          "Explain the difference between a Roth IRA and a Traditional IRA.",
          "What are some common budgeting mistakes to avoid?",
          "Is now a good time to buy stocks?",
          "Help me create a plan to pay off my student loans faster."
        ]
      },
      'travel-guide': {
        messages: [
          `Bon voyage! I'm ${character.name}, your personal travel assistant. ${character.description}`,
          `Pack your bags! ${character.name} here to craft your dream vacation.`,
          `Ready to explore? ${character.name} at your service. ${character.description}`
        ],
        questions: [
          "What are the must-see sights in Paris for a 5-day trip?",
          "Suggest budget-friendly travel destinations in Southeast Asia.",
          "How do I apply for a visa for Brazil?",
          "What are essential items to pack for a hiking trip in the Rockies?",
          "Find family-friendly resorts in Cancun with good reviews."
        ]
      },
      'health-coach': {
        messages: [
          `Hi! I'm ${character.name}, your wellness assistant. ${character.description}`,
          `Let's build healthy habits! ${character.name} here to support you.`,
          `Your health journey starts now with ${character.name}. ${character.description}`
        ],
        questions: [
          "Give me some healthy snack ideas for work.",
          "How can I improve my sleep quality?",
          "Suggest exercises to strengthen my lower back.",
          "What are the benefits of meditation?",
          "Create a simple weekly meal prep plan."
        ]
      },
      'tech-mentor': {
        messages: [
          `Hello World! I'm ${character.name}, your coding assistant. ${character.description}`,
          `Let's debug this together! ${character.name} at your service.`,
          `Your tech questions answered by ${character.name}. ${character.description}`
        ],
        questions: [
          "Explain how APIs work in simple terms.",
          "What's the difference between front-end and back-end development?",
          "How do I set up a GitHub repository?",
          "Suggest resources for learning Python for beginners.",
          "Debug this JavaScript code: `[code snippet placeholder]`" // Note: Placeholder needs real code
        ]
      },
      'default': {
        messages: [
          `Hello! I'm ${character.name}. ${character.description}. How can I assist you?`,
          `Hi there! ${character.name} here. What would you like to accomplish today?`,
          `Welcome! I'm ${character.name}. Ready to help you with specialized knowledge.`
        ],
        questions: [
          "What are your top recommendations in this field?",
          "Help me understand advanced concepts in this area",
          "What common mistakes should I avoid?",
          "Suggest practical applications for this knowledge",
          "What resources would you recommend to learn more?"
        ]
      }
    };

    // Determine AI assistant type
    const assistantType = character.category?.toLowerCase().replace(/\s+/g, '-') || 'default';
    const assistantConfig = aiAssistantConfigurations[assistantType] || aiAssistantConfigurations['default'];

    // Format customized welcome message
    const welcomeMessage = assistantConfig.messages.at(Math.floor(Math.random() * assistantConfig.messages.length)) ?? assistantConfig.messages[0];
    const questionList = assistantConfig.questions
      .map((q:string) => `• ${q}`)
      .join('\n');
    
    return `${welcomeMessage}\n\nHere are specific things I can help with:\n${questionList}`;

  };

  const closeButtonTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText('');

    // Create a user message object
    const newUserMessage: Message = {
      id: Crypto.randomUUID(),
      text: userMessage,
      sender: 'user',
      timestamp: Date.now(),
    };

    
        // Add user message to UI
        setMessages(prev => [...prev, newUserMessage]);
    
        // Increment guest message count and update session if in guest mode
        if (isGuest) {
          await incrementGuestMessageCount();
          await updateGuestChatSession(userMessage); // Update guest session
      // Check if we should show subscription offer
      const shouldShowOffer = await shouldShowSubscriptionOffer();
      if (shouldShowOffer) {
        // Clear any existing timeout
        if (closeButtonTimeoutRef.current) {
          clearTimeout(closeButtonTimeoutRef.current);
        }
        
        setShowCloseButton(false);
        closeButtonTimeoutRef.current = setTimeout(() => {
          setShowCloseButton(true);
        }, 5000); // Show close button after 5 seconds in dev mode
        // Navigate to DiscountOfferScreen instead, passing the state
        navigation.navigate('DiscountOfferScreen', { fromCharacter: true });
        return;
      }
    }

    // Save message to database if user is logged in
    if (user && !isGuest && conversationId) {
      try {
        await sendMessageToDb(
          conversationId,
          'user',
          userMessage
        );
      } catch (error) {
        console.error('Error saving user message:', error);
      }
    }

    // Show typing indicator
    setLoading(true);
    const typingInterval = setInterval(() => {
      setTypingIndicator(prev => (prev + 1) % TYPING_INDICATORS.length);
    }, 500);

    try {
      // Get AI response
      const aiResponse = await fetchAIResponse(userMessage, messages, character);

      // Create an AI message object
      const newAIMessage: Message = {
        id: Crypto.randomUUID(),
        text: aiResponse,
        sender: 'ai',
        timestamp: Date.now(),
      };

      // Add AI message to UI
      setMessages(prev => [...prev, newAIMessage]);

      // Update guest session if applicable (after adding AI message to UI)
      if (isGuest) {
        await updateGuestChatSession(aiResponse); // Update with AI response preview
      }

      // Save AI message to database if user is logged in
      if (user && !isGuest && conversationId) {
        try {
          await sendMessageToDb(
            conversationId,
            'character',
            aiResponse,
            { characterId: character.id }
          );
        } catch (error) {
          console.error('Error saving AI message:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching AI response:', error);
      Alert.alert('Error', 'Failed to get a response. Please try again.');
    } finally {
      clearInterval(typingInterval);
      setLoading(false);
    }
  };

  // Function to update guest chat session in AsyncStorage
  const updateGuestChatSession = async (lastMessageText: string) => {
    if (!isGuest) return; // Only run for guests

    try {
      const now = new Date().toISOString();
      const currentChatsRaw = await AsyncStorage.getItem(GUEST_CHATS_STORAGE_KEY);
      let currentChats: GuestChatSessionData[] = [];

      if (currentChatsRaw) {
        try {
          currentChats = JSON.parse(currentChatsRaw);
          if (!Array.isArray(currentChats)) currentChats = [];
        } catch (e) {
          console.error("Failed to parse guest chats, resetting.", e);
          currentChats = [];
        }
      }

      const existingIndex = currentChats.findIndex(chat => chat.characterId === character.id);
      const sessionData: GuestChatSessionData = {
        id: character.id, // Use characterId as unique ID for guest sessions
        characterId: character.id,
        conversationId: conversationId || Crypto.randomUUID(), // Use existing or generate new UUID for guest convo ID
        name: character.name,
        // Store null for avatar in guest sessions, as require() results aren't serializable.
        // ChatListScreen will use a placeholder based on this null.
        avatar: null,
        lastMessage: lastMessageText.substring(0, 100), // Truncate preview
        lastInteractionAt: now,
      };

      if (existingIndex > -1) {
        // Update existing session
        currentChats[existingIndex] = sessionData;
      } else {
        // Add new session
        currentChats.push(sessionData);
      }

      // Sort by date and limit
      currentChats.sort((a, b) => new Date(b.lastInteractionAt).getTime() - new Date(a.lastInteractionAt).getTime());
      const limitedChats = currentChats.slice(0, 15); // Keep only the 15 most recent

      await AsyncStorage.setItem(GUEST_CHATS_STORAGE_KEY, JSON.stringify(limitedChats));

    } catch (error) {
      console.error("Error updating guest chat session:", error);
    }
  };


  const fetchAIResponse = async (
    userInput: string,
    chatHistory: Message[],
    character: Character
  ): Promise<string> => {
    // Format character context based on the character
    const characterContext = `You are ${character.name}. ${character.description}. You embody the following traits: ${(character.tags || []).join( // Handle potentially undefined tags
      ', '
    )}. Respond in character to the user's messages. Keep your responses conversational, engaging, and consistent with your character.`;

    // Format the conversation history for the API
    const conversationHistory = chatHistory.map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));

    // Add system message with character context
    const apiMessages = [
      {
        role: 'system',
        content: characterContext,
      },
      ...conversationHistory,
      { role: 'user', content: userInput },
    ];

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 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',
          'HTTP-Referer': 'https://fantasyai.app', // Replace with your actual domain if needed
          'X-Title': 'Fantasy AI Chat'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-coder', // DeepSeek R1 model
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

      // Fallback to predefined responses if API call fails
      const defaultResponses = [
        "Hey there! What's up?",
        "That's really interesting! I'd love to hear more.",
        "I was just thinking about that the other day.",
        "I'm not sure I understand. Could you explain that differently?",
        "Let me think about that for a moment...",
        "I appreciate you sharing that with me.",
      ];

      // Return a fallback response
      return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }
  };

  // Function to render a message with animation
  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';

    // Initialize animation values if they don't exist for this message
    if (!animationRefs.current.has(item.id)) {
      const fadeAnim = new Animated.Value(0);
      const slideAnim = new Animated.Value(isUser ? 50 : -50); // Adjust initial slide based on sender
      animationRefs.current.set(item.id, { fadeAnim, slideAnim });

      // Start animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: MESSAGE_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: MESSAGE_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }

    // Get animation values
    const messageAnimation = animationRefs.current.get(item.id) || { fadeAnim: new Animated.Value(1), slideAnim: new Animated.Value(0) };

    // Format timestamp for display
    const messageDate = new Date(item.timestamp);
    const formattedTime = messageDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <Animated.View
        key={item.id}
        style={[
          styles.messageRow, // Use messageRow for overall layout
          isUser ? styles.userMessageRow : styles.aiMessageRow,
          {
            opacity: messageAnimation.fadeAnim,
            transform: [{ translateY: messageAnimation.slideAnim }],
          },
        ]}
      >
        {!isUser && (
          <Image
            source={typeof character.avatar === 'number' ? character.avatar : { uri: character.avatar }}
            style={[styles.messageAvatar, { borderColor: colors.avatarBorder }]} // Apply conditional border here
          />
        )}

        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userMessageBubble : styles.aiMessageBubble,
            isUser ? { backgroundColor: colors.userBubble } : { backgroundColor: colors.aiBubble, borderColor: colors.border, borderWidth: isDarkMode ? 0 : 1 },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isUser ? colors.userText : colors.aiText }
            ]}
          >
            {item.text}
          </Text>

          <Text
            style={[
              styles.messageTime,
              { color: isUser ? 'rgba(255, 255, 255, 0.7)' : colors.subText }
            ]}
          >
            {formattedTime}
          </Text>
        </View>

        {isUser && (
          <View style={styles.userAvatarPlaceholder} /> // Keep placeholder for alignment
        )}
      </Animated.View>
    );
  }, [isDarkMode, character, colors]); // Include colors in dependency array

  const handleBack = () => {
    // Navigate back to the main tabs screen which contains the home tab
    navigation.navigate('MainTabs');
  };

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
                { borderColor: selectedTheme.id === item.id ? colors.primary : colors.border } // Highlight selected
              ]}
              onPress={() => {
                setSelectedTheme(item);
                setShowThemeSelector(false);
              }}
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.headerContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenterContent}>
            <Image
              source={typeof character.avatar === 'number' ? character.avatar : { uri: character.avatar }}
              style={[styles.headerAvatar, { borderColor: colors.avatarBorder }]} // Use conditional border
            />
            <Text style={[styles.headerTitle, { color: colors.text }]}>{character.name}</Text>
          </View>
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowThemeSelector(true)}>
            <Ionicons name="color-palette-outline" size={26} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ImageBackground
          source={selectedTheme.background}
          style={styles.chatAreaContainer}
          imageStyle={styles.chatBackgroundImage}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageListContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          />
        </ImageBackground>

        {loading && (
          <View style={[styles.typingIndicatorContainer, { backgroundColor: colors.background }]}>
            <Image source={character.avatar} style={[styles.typingIndicatorAvatar, { borderColor: colors.avatarBorder }]} />
            <Text style={[styles.typingIndicatorText, { color: colors.subText }]}>
              {character.name} {TYPING_INDICATORS[typingIndicator]}
            </Text>
          </View>
        )}

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
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={24} color={inputText.trim() ? '#FFFFFF' : colors.subText} />
          </TouchableOpacity>
        </View>

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

// --- Styles ---
const styles = StyleSheet.create({
  // --- Layout ---
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Distribute space
    paddingHorizontal: 10, // Reduced horizontal padding
    paddingVertical: 10, // Reduced vertical padding
    borderBottomWidth: 1,
    height: 60, // Fixed height for consistency
  },
  headerButton: {
    padding: 8, // Consistent padding for buttons
    minWidth: 40, // Ensure buttons have minimum tap area
    alignItems: 'center', // Center icon
  },
  headerCenterContent: {
    flex: 1, // Allow center content to take available space
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center items horizontally
    marginHorizontal: 5, // Add some margin around center content
  },
  headerAvatar: {
    width: 36, // Slightly smaller avatar
    height: 36,
    borderRadius: 18,
    marginRight: 10, // Adjusted margin
    borderWidth: 1, // Keep border thin
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  chatAreaContainer: {
    flex: 1,
  },
  chatBackgroundImage: {
    // Styles for the background image itself if needed (e.g., resizeMode)
  },
  messageListContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexGrow: 1, // Ensure it grows to fill space
  },

  // --- Messages ---
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16, // Increased spacing between messages
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
    borderWidth: 1, // Thin border
  },
  userAvatarPlaceholder: { // Used for alignment on user side
    width: 36,
    marginRight: 8, // Match avatar margin
  },
  messageBubble: {
    maxWidth: '75%', // Max width for bubble
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18, // Rounded corners
    marginHorizontal: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userMessageBubble: {
    borderTopRightRadius: 4, // Characteristic shape
  },
  aiMessageBubble: {
    borderTopLeftRadius: 4, // Characteristic shape
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
    opacity: 0.7, // Make time less prominent
  },

  // --- Typing Indicator ---
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

  // --- Input Area ---
  inputAreaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderRadius: 24, // Fully rounded input
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8, // Adjust padding per platform
    marginRight: 8,
    fontSize: 16,
    maxHeight: 120, // Limit height for multiline
  },
  sendButtonContainer: {
    width: 48,
    height: 48,
    borderRadius: 24, // Circular button
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },

  // --- Guest Banner ---
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

  // --- Theme Selector Modal ---
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
  themeItemSelected: {
    // Border color is applied dynamically based on selection
  },
  themePreviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1, // Add border to previews
    borderColor: 'rgba(0,0,0,0.1)', // Light border for previews
  },
  themeNameText: {
    fontSize: 14,
    fontWeight: '500',
  },
});