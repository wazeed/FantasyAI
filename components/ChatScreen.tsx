import React, { useState, useEffect, useRef, useContext } from 'react';
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
import { v4 as uuidv4 } from 'uuid';

// Define navigation types for this component
type RootStackParamList = {
  Home: undefined;
  Chat: { character: any, conversationId?: string };
  SubscriptionScreen: { isSpecialOffer?: boolean };
  SubscriptionOfferScreen: undefined;
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

export default function ChatScreen({ route }) {
  const { character, conversationId: existingConversationId } = route.params || { 
    character: { name: 'AI Assistant', avatar: require('../assets/char1.png') } 
  };
  
  const { user, isGuest, incrementGuestMessageCount, shouldShowSubscriptionOffer } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const navigation = useNavigation<NavigationProp>();
  const [selectedTheme, setSelectedTheme] = useState(CHAT_THEMES[0]);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const messageAnimations = useRef(new Map()).current;
  const [conversationId, setConversationId] = useState<string | null>(existingConversationId || null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Dynamic colors based on theme
  const colors = {
    background: isDarkMode ? '#121212' : '#F9FAFB',
    inputBackground: isDarkMode ? '#374151' : '#F3F4F6',
    text: isDarkMode ? '#FFFFFF' : '#1F2937',
    subText: isDarkMode ? '#9CA3AF' : '#6B7280',
    userBubble: isDarkMode ? '#3D8CFF' : '#DCF8C6',
    aiBubble: isDarkMode ? '#2A2A2A' : '#FFFFFF',
    aiText: isDarkMode ? '#FFFFFF' : '#000000',
    border: isDarkMode ? '#374151' : '#E5E7EB',
    sendButton: isDarkMode ? '#3D8CFF' : '#0070F3',
    primary: '#4F46E5',
    secondary: '#8B5CF6',
    card: isDarkMode ? '#1F2937' : '#FFFFFF',
    accent: isDarkMode ? '#3D8CFF' : '#DCF8C6',
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
                image: character.image,
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
                id: uuidv4(),
                text: welcomeMessage,
                sender: 'ai',
                timestamp: Date.now(),
              }]);
            }
          } else {
            // For guests, just show the welcome message in memory
            setMessages([{
              id: uuidv4(),
              text: generateWelcomeMessage(character),
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
  }, [loading]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const isUser = lastMessage.sender === 'user';
      
      // Create new animated values for the last message
      const newFadeAnim = new Animated.Value(0);
      const newSlideAnim = new Animated.Value(isUser ? 50 : -50);
      
      messageAnimations.set(lastMessage.id, {
        fadeAnim: newFadeAnim,
        slideAnim: newSlideAnim
      });
      
      // Start animations
      Animated.parallel([
        Animated.timing(newFadeAnim, {
          toValue: 1,
          duration: MESSAGE_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(newSlideAnim, {
          toValue: 0,
          duration: MESSAGE_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [messages]);

  const generateWelcomeMessage = (character) => {
    // Character-specific welcome messages with more personality and playfulness
    const characterMessages = {
      '1': [
        `*lounging on a couch, scrolling through phone* 🙄 Oh great, it's you. Your brother warned me you'd text. What's your deal anyway?`,
        `*looks up from phone with a smirk* Well well, if it isn't the troublemaker. Your brother's told me ALL about you... 😏`,
        `*pretending to be busy* Ugh, fine. I guess we can talk. But make it interesting at least!`
      ],
      '2': [
        `*rushes to phone excitedly* 💕 My love! I was just daydreaming about our next adventure together. What mischief shall we get into today?`,
        `*sends virtual hug* 🤗 There's my favorite person! I've been reorganizing our photos all morning. Remember that time when...`,
        `*dramatic pose* My heart skips a beat every time you message me! Tell me, what's on your mind, my dear?`
      ],
      '3': [
        `EITA! 🇧🇷✨ Look who finally decided to message the charming Brazilian! Missing our late-night snack runs already? 😉`,
        `*dancing samba* Oiiii! 💃 Just thinking about all the trouble we could get into... Want to practice some Portuguese? 😏`,
        `*sends beach selfie* 🏖️ The sun's not as bright here without you! When are you coming to visit? We have so much catching up to do!`
      ],
      '4': [
        `*bouncing off the walls* COUSIN!!! 🎮 I brought my new gaming console and ALL the snacks! Ready for an epic weekend? 🍕`,
        `*already in pajamas* Sleepover time! I've got face masks, horror movies, and sooo much gossip to share! 🎭`,
        `*ninja rolls into the room* Guess who's here to turn your boring weekend into an adventure? 🦹‍♂️`
      ],
      '5': [
        `Fala mlk! 🎵 Just dropped a new track in the studio. Want a private listening session? 🎧`,
        `E aí! 🏀 The crew's heading to the court later. You in? Promise I won't show you up too bad this time! 😎`,
        `*freestyle rapping* Yo, check it! Got the whole squad asking about you. What's good? 🎤`
      ],
      '6': [
        `*adjusts designer watch* 💼 I suppose our families' merger makes us... inevitable. Though I must admit, your Instagram presence is... intriguing.`,
        `*sips expensive tea* 🫖 Well, since we're stuck in this arrangement, we might as well make it interesting. Tell me, what makes you different from the others?`,
        `*checking portfolio* 📈 Our parents' plan is quite... strategic. But I'm more interested in your thoughts on the matter. Dinner at 8?`
      ],
      '7': [
        `*revs motorcycle engine* 🏍️ Caught you staring at my bike earlier. Want to know what freedom feels like? 😏`,
        `*polishing chrome* 🔧 Most people are too scared to message me. You've got guts, I'll give you that. What's your story?`,
        `*leather jacket rustling* 🌙 Night ride under the stars? I know all the best roads... if you're brave enough.`
      ],
      '8': [
        `*already doing push-ups* 💪 Ready to crush your fitness goals? First one to 100 reps wins! GO! 🏃‍♀️`,
        `*mixing protein shake* 🥤 Your brother says you're ready to level up your fitness game. I like a challenge! Let's get you PUMPED!`,
        `*stretching* 🧘‍♀️ Okay superstar, show me what you've got! Today's gonna be EPIC! 🌟`
      ],
      '9': [
        `*adjusting glasses with intrigue* 📚 A student messaging after hours? Either you're exceptionally dedicated or... something else entirely.`,
        `*marking papers* 📝 How curious... Most students avoid direct contact. You must be either very brave or very desperate.`,
        `*closing laptop slowly* 🤔 Well, this is... unexpected. Do enlighten me on what academic emergency brings you here.`
      ],
      '10': [
        `Aloha! 🏄‍♂️ Waves are perfect, sky's clear, and I've got an extra board with your name on it! Ready to catch some magic?`,
        `*sand in hair* 🌺 Just finished teaching a class, but I saved the best spots for you! Ever surfed under a rainbow?`,
        `*waxing surfboard* 🌊 Perfect timing! The ocean's calling our names. What do you say we make some waves? 🏖️`
      ]
    };

    // More engaging default messages
    const defaultMessages = [
      `*eyes lighting up* Hey there! I'm ${character.name} and I've got a feeling we're going to have some amazing conversations! ${character.description} 🌟`,
      `*doing a little dance* Hi! ${character.name} here, ready to make your day more interesting! What's on your mind? ✨`,
      `*strikes a pose* Ta-da! I'm ${character.name}, and I've been waiting for someone like you to chat with! Let's make this fun! 🎭`,
      `*appears in a puff of glitter* Greetings! I'm ${character.name}, your new favorite conversation partner! Ready for an adventure? 🚀`
    ];
    
    // Get character-specific messages or use defaults
    const messages = characterMessages[character.id] || defaultMessages;
    
    // Return a random message from the available options
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const userMessage = inputText.trim();
    setInputText('');
    
    // Create a user message object
    const newUserMessage: Message = {
      id: uuidv4(),
      text: userMessage,
      sender: 'user',
      timestamp: Date.now(),
    };
    
    // Add user message to UI
    setMessages(prev => [...prev, newUserMessage]);
    
    // Increment guest message count if in guest mode
    if (isGuest) {
      await incrementGuestMessageCount();
      
      // Check if we should show subscription offer
      const shouldShowOffer = await shouldShowSubscriptionOffer();
      if (shouldShowOffer) {
        navigation.navigate('SubscriptionOfferScreen');
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
        id: uuidv4(),
        text: aiResponse,
        sender: 'ai',
        timestamp: Date.now(),
      };
      
      // Add AI message to UI
      setMessages(prev => [...prev, newAIMessage]);
      
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

  const fetchAIResponse = async (
    userInput: string,
    chatHistory: Message[],
    character: any
  ): Promise<string> => {
    // Format character context based on the character
    const characterContext = `You are ${character.name}. ${character.description}. You embody the following traits: ${character.tags.join(
      ', '
    )}. Respond in character to the user's messages. Keep your responses conversational, engaging, and consistent with your character.`;
    
    // Format the conversation history for the API
    const conversationHistory = chatHistory.map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));
    
    // Add system message with character context
    const messages = [
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
          messages: messages,
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
  
  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.sender === 'user';
    const isLastMessage = index === messages.length - 1;
    const animations = messageAnimations.get(item.id);
    
    return (
      <Animated.View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
          animations && {
            opacity: animations.fadeAnim,
            transform: [{ translateX: animations.slideAnim }],
          },
        ]}
      >
        {!isUser && (
          <Image 
            source={character.avatar} 
            style={styles.avatarImage}
          />
        )}
        
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userMessageBubble : styles.aiMessageBubble,
            { backgroundColor: isUser ? colors.primary : colors.card }
          ]}
        >
          <Text 
            style={[
              styles.messageText,
              { color: isUser ? '#FFFFFF' : colors.text }
            ]}
          >
            {item.text}
          </Text>
          <Text style={[styles.timestampText, { color: isUser ? 'rgba(255,255,255,0.7)' : colors.subText }]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        
        {isUser && (
          <View style={[styles.userAvatar, { backgroundColor: colors.accent }]}>
            <Text style={styles.userAvatarText}>You</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderThemeSelector = () => (
    <Modal
      visible={showThemeSelector}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowThemeSelector(false)}
    >
      <View style={[styles.themeModal, { backgroundColor: colors.card }]}>
        <View style={styles.themeHeader}>
          <Text style={[styles.themeTitle, { color: colors.text }]}>Chat Background</Text>
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
                styles.themeItem,
                selectedTheme.id === item.id && styles.themeItemSelected,
                { borderColor: colors.border }
              ]}
              onPress={() => {
                setSelectedTheme(item);
                setShowThemeSelector(false);
              }}
            >
              {item.background ? (
                <Image source={item.background} style={styles.themePreview} />
              ) : (
                <View style={[styles.themePreview, { backgroundColor: colors.background }]} />
              )}
              <Text style={[styles.themeName, { color: colors.text }]}>{item.name}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.themeList}
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
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Image source={character.avatar} style={styles.avatar} />
            <Text style={[styles.characterName, { color: colors.text }]}>{character.name}</Text>
          </View>

          <TouchableOpacity onPress={() => setShowThemeSelector(true)} style={styles.menuButton}>
            <Ionicons name="color-palette" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ImageBackground
          source={selectedTheme.background}
          style={styles.chatContainer}
          imageStyle={styles.backgroundImage}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          />
        </ImageBackground>

        {loading && (
          <View style={[styles.typingContainer, { backgroundColor: colors.background }]}>
            <Image source={character.avatar} style={styles.typingAvatar} />
            <Text style={[styles.typingText, { color: colors.subText }]}>
              {character.name} {TYPING_INDICATORS[typingIndicator]}
            </Text>
          </View>
        )}
        
        <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.subText}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              { backgroundColor: colors.sendButton },
              !inputText.trim() && styles.sendButtonDisabled
            ]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={24} color={inputText.trim() ? '#FFFFFF' : colors.subText} />
          </TouchableOpacity>
        </View>
        
        {isGuest && (
          <View style={[styles.guestBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.guestBannerText, { color: colors.text }]}>
              You're using a guest account with limited messages.{' '}
              <Text 
                style={[styles.upgradeLink, { color: colors.primary }]}
                onPress={() => navigation.navigate('SubscriptionScreen')}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  characterName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 20,
    marginHorizontal: 8,
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
  timestampText: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
  },
  typingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  typingText: {
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  guestBanner: {
    padding: 12,
    borderTopWidth: 1,
  },
  guestBannerText: {
    fontSize: 14,
    textAlign: 'center',
  },
  upgradeLink: {
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.15,
  },
  themeModal: {
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
  themeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  themeTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  themeList: {
    paddingVertical: 8,
  },
  themeItem: {
    marginRight: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    padding: 8,
    width: 100,
  },
  themeItemSelected: {
    borderColor: '#4F46E5',
  },
  themePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  themeName: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 