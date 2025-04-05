import React, { useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Pressable, // Keep Pressable
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
// Removed unused: Dimensions, useRef, useEffect, Animated, RefreshControl, ScrollView, LinearGradient, Image
// Removed unused: BottomTabNavigationProp (using NavigationProp is sufficient)

// --- Type Definitions ---

// Renamed Tool to Assistant for clarity
interface Assistant {
  id: string;
  name: string;
  description: string;
  image: any; // Keep for now for navigation params compatibility
  tags: string[];
  // followers: string; // Removed as unused
  category: string;
  suggestedQuestions: string[];
}

interface Category {
  id: string;
  name: string;
}

// Parameters for navigating to the Chat screen
interface CharacterParams {
  id: string;
  name: string;
  avatar: any; // Keep image for chat screen compatibility for now
  description?: string;
  tags?: string[];
  category?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

// Navigation stack parameters
type RootStackParamList = {
  Home: undefined;
  Chat: { character: CharacterParams };
  DiscountOfferScreen: {
    fromCharacter: boolean;
    character: CharacterParams;
  };
  Profile: undefined; // Keep for type definition even if navigation is removed from this screen
  HelpCenter: undefined; // Keep for type definition
};

// Component Props
type HomeScreenNavigationProp = NavigationProp<RootStackParamList, 'Home'>;

// --- Constants ---

const PADDING_HORIZONTAL = 16;
const GAP = 16;
const NUM_COLUMNS = 2;
// Calculate column width dynamically (moved inside component or keep global if no dependency change)
// const { width } = Dimensions.get('window'); // Removed Dimensions import
// const COLUMN_WIDTH = (width - PADDING_HORIZONTAL * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
// Note: COLUMN_WIDTH calculation needs Dimensions, re-import or calculate differently if needed.
// For now, assuming a fixed width or alternative calculation method if Dimensions is truly removed.
// Re-adding Dimensions temporarily for width calculation.
import { Dimensions } from 'react-native';
const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - PADDING_HORIZONTAL * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;


// Renamed TOOLS to ASSISTANTS
const ASSISTANTS: Assistant[] = [
  // ... (Keep the existing assistant data, ensure it matches the 'Assistant' interface)
  // Example entry:
  {
    id: 'self-growth',
    name: 'Self-Growth',
    description: 'Become a better version of yourself',
    image: require('../assets/char1.png'),
    tags: ['Personal', 'Development', 'Improvement'],
    // followers: '1.2M', // Removed
    category: 'Life',
    suggestedQuestions: [
      "How can I develop better daily habits?",
      "What are some ways to boost my confidence?",
      "How do I stay motivated when working on self-improvement?",
      "What books would you recommend for personal growth?"
    ]
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    description: 'Fill your life with purpose and joy',
    image: require('../assets/char2.png'),
    tags: ['Habits', 'Routines', 'Wellbeing'],
    category: 'Life',
    suggestedQuestions: [
      "How can I create a more balanced daily routine?",
      "What are some ways to reduce stress in my life?",
      "How do I find more meaning in my daily activities?",
      "What small changes can I make to improve my wellbeing?"
    ]
  },
  {
    id: 'spirituality',
    name: 'Spirituality',
    description: 'Enrich your life with wisdom',
    image: require('../assets/char3.png'),
    tags: ['Mindfulness', 'Meditation', 'Philosophy'],
    category: 'Life',
    suggestedQuestions: [
      "How can I start a meditation practice?",
      "What are some simple mindfulness exercises?",
      "How do I find inner peace in stressful times?",
      "What spiritual practices would you recommend for beginners?"
    ]
  },
  {
    id: 'fitness',
    name: 'Fitness',
    description: 'Achieve your fitness goals',
    image: require('../assets/char4.png'),
    tags: ['Workouts', 'Nutrition', 'Health'],
    category: 'Health',
    suggestedQuestions: [
      "What's a good beginner workout routine?",
      "How can I stay consistent with exercise?",
      "What foods should I eat to support my fitness goals?",
      "How do I prevent injuries when working out?"
    ]
  },
  {
    id: 'career',
    name: 'Career',
    description: 'Get your work done faster',
    image: require('../assets/char5.png'),
    tags: ['Productivity', 'Skills', 'Growth'],
    category: 'Work',
    suggestedQuestions: [
      "How can I be more productive at work?",
      "What skills are most valuable in my industry?",
      "How do I negotiate a better salary?",
      "What's the best way to handle workplace conflicts?"
    ]
  },
  {
    id: 'emails',
    name: 'Emails',
    description: 'Craft emails in seconds',
    image: require('../assets/char6.png'),
    tags: ['Professional', 'Communication', 'Business'],
    category: 'Work',
    suggestedQuestions: [
      "How do I write a professional follow-up email?",
      "What's a good subject line for a sales email?",
      "How can I make my emails more concise?",
      "What's the best way to structure a business email?"
    ]
  },
  {
    id: 'lyrics-poetry',
    name: 'Lyrics & Poetry',
    description: 'Make songs and poems',
    image: require('../assets/char7.png'),
    tags: ['Creative', 'Writing', 'Artistic'],
    category: 'Creative',
    suggestedQuestions: [
      "How do I write a catchy chorus?",
      "What are some good rhyme schemes for poetry?",
      "How can I improve my songwriting skills?",
      "What makes a poem emotionally powerful?"
    ]
  },
  {
    id: 'fun',
    name: 'Fun',
    description: 'Explore exciting activities',
    image: require('../assets/char8.png'),
    tags: ['Games', 'Entertainment', 'Leisure'],
    category: 'Entertainment',
    suggestedQuestions: [
      "What are some fun party games for adults?",
      "How can I make a game night more exciting?",
      "What are some creative date night ideas?",
      "How do I plan a memorable weekend getaway?"
    ]
  },
  {
    id: 'link-ask',
    name: 'Link & Ask',
    description: 'Explore any web content',
    image: require('../assets/char9.png'),
    tags: ['Research', 'Information', 'Learning'],
    category: 'Education',
    suggestedQuestions: [
      "How do I research a topic effectively?",
      "What are some reliable sources for news?",
      "How can I verify information I find online?",
      "What's the best way to summarize long articles?"
    ]
  },
  {
    id: 'languages',
    name: 'Languages',
    description: 'Simplify your language learning',
    image: require('../assets/char10.png'),
    tags: ['Translation', 'Practice', 'Culture'],
    category: 'Education',
    suggestedQuestions: [
      "What's the fastest way to learn a new language?",
      "How can I improve my pronunciation?",
      "What are good language learning apps?",
      "How do I stay motivated when learning a language?"
    ]
  },
  {
    id: 'math',
    name: 'Math',
    description: 'Quickly solve math problems',
    image: require('../assets/character/anime1.png'),
    tags: ['Calculations', 'Formulas', 'Equations'],
    category: 'Education',
    suggestedQuestions: [
      "How do I solve quadratic equations?",
      "What's the best way to learn calculus?",
      "How can I improve my mental math skills?",
      "What are some real-world applications of algebra?"
    ]
  },
  {
    id: 'ai-learning',
    name: 'AI Learning',
    description: 'Study any subject with ease',
    image: require('../assets/character/anime2.png'),
    tags: ['Tutoring', 'Knowledge', 'Study'],
    category: 'Education',
    suggestedQuestions: [
      "How can AI help me learn more effectively?",
      "What are the best AI learning tools?",
      "How do I create a personalized learning plan with AI?",
      "What subjects are best suited for AI-assisted learning?"
    ]
  },
  {
    id: 'school',
    name: 'School',
    description: 'Get help with homework',
    image: require('../assets/character/anime3.png'),
    tags: ['Assignments', 'Projects', 'Research'],
    category: 'Education',
    suggestedQuestions: [
      "How can I improve my study habits?",
      "What's the best way to take notes?",
      "How do I manage my homework workload?",
      "What strategies help with test preparation?"
    ]
  },
  {
    id: 'social-media',
    name: 'Social Media',
    description: 'Create content for social media',
    image: require('../assets/character/anime4.png'),
    tags: ['Posts', 'Captions', 'Marketing'],
    category: 'Marketing',
    suggestedQuestions: [
      "How can I grow my social media following?",
      "What types of content perform best on Instagram?",
      "How do I write engaging captions?",
      "What's the best time to post on different platforms?"
    ]
  },
  {
    id: 'quote-maker',
    name: 'Quote Maker',
    description: 'Find a quote for any occasion',
    image: require('../assets/character/anime5.png'),
    tags: ['Inspiration', 'Wisdom', 'Sayings'],
    category: 'Creative',
    suggestedQuestions: [
      "What are some inspirational quotes about success?",
      "Can you suggest motivational quotes for tough times?",
      "What are famous quotes about love?",
      "How can I create my own meaningful quotes?"
    ]
  },
  {
    id: 'ai-scanner',
    name: 'AI Scanner',
    description: 'Scan and extract text from docs',
    image: require('../assets/character/celebrity1.png'),
    tags: ['OCR', 'Documents', 'Text'],
    category: 'Productivity',
    suggestedQuestions: [
      "How accurate is the text extraction?",
      "What file formats does the scanner support?",
      "Can it recognize handwriting?",
      "How does it handle poor quality documents?"
    ]
  },
  {
    id: 'translator',
    name: 'Translator',
    description: 'Break language barriers on the go',
    image: require('../assets/character/celebrity2.png'),
    tags: ['Languages', 'Communication', 'Global'],
    category: 'Productivity',
    suggestedQuestions: [
      "How many languages does the translator support?",
      "Can it translate spoken conversations in real-time?",
      "How accurate are the translations?",
      "Does it work offline for common languages?"
    ]
  }
];

// Initial categories data
const INITIAL_CATEGORIES: Category[] = [
  { id: 'all', name: 'All' },
  { id: 'life', name: 'Life' },
  { id: 'health', name: 'Health' },
  { id: 'work', name: 'Work' },
  { id: 'creative', name: 'Creative' },
  { id: 'education', name: 'Education' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'productivity', name: 'Productivity' },
  { id: 'entertainment', name: 'Entertainment' },
];

// Icon mapping for assistants
const ASSISTANT_ICONS: { [key: string]: { name: keyof typeof Ionicons.glyphMap; color: string } } = {
  'self-growth': { name: 'ribbon-outline', color: '#34D399' },
  'lifestyle': { name: 'sunny-outline', color: '#FBBF24' },
  'spirituality': { name: 'sparkles-outline', color: '#A78BFA' },
  'fitness': { name: 'barbell-outline', color: '#EF4444' },
  'career': { name: 'briefcase-outline', color: '#60A5FA' },
  'emails': { name: 'mail-outline', color: '#93C5FD' },
  'lyrics-poetry': { name: 'musical-notes-outline', color: '#F472B6' },
  'fun': { name: 'game-controller-outline', color: '#EC4899' },
  'link-ask': { name: 'link-outline', color: '#2DD4BF' },
  'languages': { name: 'language-outline', color: '#818CF8' },
  'math': { name: 'calculator-outline', color: '#F87171' },
  'ai-learning': { name: 'school-outline', color: '#6EE7B7' },
  'school': { name: 'library-outline', color: '#FCD34D' },
  'social-media': { name: 'share-social-outline', color: '#A5B4FC' },
  'quote-maker': { name: 'chatbubble-ellipses-outline', color: '#C4B5FD' },
  'ai-scanner': { name: 'scan-outline', color: '#7DD3FC' },
  'translator': { name: 'swap-horizontal-outline', color: '#FDA4AF' },
};

// --- Helper Components ---

interface CategoryButtonProps {
  item: Category;
  isSelected: boolean;
  onPress: (id: string) => void;
  colors: { categorySelected: string; categoryBg: string; subText: string; };
}

const CategoryButton = React.memo(({ item, isSelected, onPress, colors }: CategoryButtonProps) => (
  <TouchableOpacity
    style={[
      styles.categoryItem,
      { backgroundColor: isSelected ? colors.categorySelected : colors.categoryBg },
      isSelected && styles.categoryItemSelected // Keep for potential specific selected styles
    ]}
    onPress={() => onPress(item.id)}
    accessibilityRole="button"
    accessibilityState={{ selected: isSelected }}
    accessibilityLabel={item.name}
  >
    <Text
      style={[
        styles.categoryText,
        { color: isSelected ? '#FFFFFF' : colors.subText },
        isSelected && styles.categoryTextSelected // Keep for potential specific selected styles
      ]}
    >
      {item.name}
    </Text>
  </TouchableOpacity>
));

interface AssistantCardProps {
  item: Assistant;
  onPress: (assistant: Assistant) => void;
  colors: { text: string; subText: string; accent: string; }; // Added accent color
  isDarkMode: boolean;
}

const AssistantCard = React.memo(({ item, onPress, colors, isDarkMode }: AssistantCardProps) => {
  const iconInfo = ASSISTANT_ICONS[item.id] || { name: 'help-circle-outline', color: colors.accent }; // Use accent color as fallback

  return (
    <View style={{ width: COLUMN_WIDTH }}>
      <Pressable
        style={[
          styles.assistantCard, // Renamed from toolCard
          isDarkMode ? styles.darkCard : styles.lightCard
        ]}
        onPress={() => onPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}. ${item.description}`}
      >
        {/* Icon Container */}
        <View style={[styles.iconContainer, { backgroundColor: iconInfo.color }]}>
          <Ionicons
            name={iconInfo.name}
            size={32}
            color="#FFFFFF" // Keep icon color white for contrast
          />
        </View>

        {/* Assistant Info */}
        <View style={styles.assistantInfo}>
          <Text style={[styles.assistantName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.assistantDescription, { color: colors.subText }]} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </Pressable>
    </View>
  );
});

// --- Main Component ---

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { isDarkMode } = useContext(ThemeContext);
  const { isGuest, shouldShowDiscountOffer, markDiscountOfferShown } = useAuth(); // Removed unused signOut
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // Removed unused: searchInputRef (no focus trigger shown), isRefreshing, toolAnimationRefs

  // Dynamic colors based on theme
  const colors = {
    background: isDarkMode ? '#121212' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    subText: isDarkMode ? '#AAAAAA' : '#666666',
    card: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    cardBorder: isDarkMode ? '#333333' : '#E0E0E0',
    accent: isDarkMode ? '#3D8CFF' : '#7E3AF2', // Keep accent for fallback icon color
    categoryBg: isDarkMode ? '#2A2A2A' : '#F0F0F0',
    categorySelected: isDarkMode ? '#3D8CFF' : '#7E3AF2',
    categoryText: isDarkMode ? '#FFFFFF' : '#000000', // Keep for potential direct use
    searchBg: isDarkMode ? '#2A2A2A' : '#F0F0F0',
    // buttonBg: isDarkMode ? '#2A2A2A' : '#F0F0F0', // Removed unused buttonBg
  };

  // Memoized category press handler
  const handleCategoryPress = useCallback((selectedId: string) => {
    setSelectedCategory(selectedId);
  }, []);

  // Memoized assistant press handler (renamed from handleToolPress)
  const handleAssistantPress = useCallback(async (assistant: Assistant) => {
    const iconInfo = ASSISTANT_ICONS[assistant.id] || { name: 'help-circle-outline', color: colors.accent };
    const characterData: CharacterParams = {
      id: assistant.id,
      name: assistant.name,
      avatar: assistant.image, // Keep image for Chat screen compatibility
      description: assistant.description,
      tags: assistant.tags,
      category: assistant.category,
      iconName: iconInfo.name,
      iconColor: iconInfo.color,
    };

    // Check for discount offer only for guest users
    if (isGuest) {
      try {
        const shouldShow = await shouldShowDiscountOffer();
        if (shouldShow) {
          console.log('Showing discount offer screen for guest');
          await markDiscountOfferShown();
          navigation.navigate('DiscountOfferScreen', {
            fromCharacter: true, // Indicate origin
            character: characterData
          });
          return; // Stop execution if navigating to discount screen
        }
      } catch (error) {
        // Log error but proceed to chat screen as a fallback
        console.error('Error checking/showing discount offer:', error);
        // Optionally use a logging service here: loggingService.error('Discount check failed', error);
      }
    }

    // Navigate to Chat screen for logged-in users or guests who didn't see the offer
    navigation.navigate('Chat', {
      character: characterData
    });
  }, [isGuest, navigation, shouldShowDiscountOffer, markDiscountOfferShown, colors.accent]); // Added dependencies

  // Filter assistants based on selected category and search query
  const filteredAssistants = ASSISTANTS.filter(assistant =>
    (selectedCategory === 'all' || assistant.category.toLowerCase() === selectedCategory.toLowerCase()) &&
    (searchQuery === '' ||
      assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assistant.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assistant.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  // Render function for category items (uses memoized component)
  const renderCategoryItem = useCallback(({ item }: { item: Category }) => (
    <CategoryButton
      item={item}
      isSelected={selectedCategory === item.id}
      onPress={handleCategoryPress}
      colors={colors}
    />
  ), [selectedCategory, handleCategoryPress, colors]); // Added dependencies

  // Render function for assistant items (uses memoized component)
  const renderAssistantItem = useCallback(({ item }: { item: Assistant }) => (
    <AssistantCard
      item={item}
      onPress={handleAssistantPress}
      colors={{ text: colors.text, subText: colors.subText, accent: colors.accent }} // Pass accent color
      isDarkMode={isDarkMode}
    />
  ), [handleAssistantPress, colors, isDarkMode]); // Added dependencies

  // Component to render when the list is empty
  const ListEmptyComponent = () => (
    <View style={styles.emptyStateContainer}>
      {/* Optional: Add an image here */}
      {/* <Image source={require('../assets/empty-search.png')} style={styles.emptyStateImage} /> */}
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Assistants Found</Text>
      <Text style={[styles.emptyStateMessage, { color: colors.subText }]}>
        {searchQuery
          ? `Try adjusting your search query or selecting a different category.`
          : `There are no assistants matching the selected category.`}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={[styles.header, isDarkMode ? styles.darkHeader : styles.lightHeader]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.appName, isDarkMode ? styles.darkAppName : styles.lightAppName]}>
            AI Assistants {/* Updated Header Text */}
          </Text>
        </View>
        {/* Removed unused profile icon */}
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, isDarkMode ? styles.darkSearchContainer : styles.lightSearchContainer]}>
        <Ionicons name="search-outline" size={18} color={colors.subText} style={styles.searchIconStyle} />
        <TextInput
          // ref={searchInputRef} // Ref removed as focus trigger is gone
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search AI assistants..."
          placeholderTextColor={colors.subText}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityLabel="Clear search query">
            <Ionicons name="close-circle" size={18} color={colors.subText} />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={INITIAL_CATEGORIES} // Use initial categories data
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Assistants List */}
      <FlatList
        data={filteredAssistants}
        renderItem={renderAssistantItem}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.assistantsList} // Renamed from toolsList
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={ListEmptyComponent} // Added empty state component
        keyboardShouldPersistTaps="handled" // Dismiss keyboard on tap outside input
      />
    </SafeAreaView>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PADDING_HORIZONTAL,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  darkHeader: {
    borderBottomColor: '#2A2A2A',
    backgroundColor: '#1A1A1A',
  },
  lightHeader: {
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: '600',
  },
  darkAppName: {
    color: '#FFFFFF',
  },
  lightAppName: {
    color: '#000000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: PADDING_HORIZONTAL,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    // borderColor managed by theme styles
  },
  darkSearchContainer: {
    backgroundColor: '#2A2A2A',
    borderColor: '#3A3A3A',
  },
  lightSearchContainer: {
    backgroundColor: '#F5F5F5',
    borderColor: '#EEEEEE',
  },
  searchIconStyle: { // Added specific style for margin
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    // color managed by theme
  },
  categoriesContainer: {
    // No specific styles needed, FlatList handles layout
  },
  categoriesList: {
    paddingHorizontal: PADDING_HORIZONTAL,
    paddingBottom: 16, // Added padding bottom for spacing
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  categoryItemSelected: {
    // Specific styles for selected item if needed beyond background color
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextSelected: {
    fontWeight: '600', // Make selected bolder
  },
  assistantsList: { // Renamed from toolsList
    paddingHorizontal: PADDING_HORIZONTAL,
    paddingBottom: 24, // Ensure content doesn't hide behind potential tab bar
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: GAP, // Apply gap between rows here
  },
  assistantCard: { // Renamed from toolCard
    // marginBottom handled by columnWrapper
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2.22,
    elevation: 3,
    alignItems: 'flex-start', // Align content to the start
    width: '100%', // Ensure card takes full column width allocated
  },
  darkCard: {
    backgroundColor: '#1E1E1E',
  },
  lightCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 14,
    marginBottom: 8,
  },
  assistantInfo: { // Renamed from toolInfo
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 0,
    alignSelf: 'stretch', // Ensure it takes width
  },
  assistantName: { // Renamed from toolName
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 5,
    textAlign: 'left',
  },
  assistantDescription: { // Renamed from toolDescription
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'left',
  },
  emptyStateContainer: {
    flex: 1, // Take remaining space if list is short
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 40, // Add space from categories/search
    minHeight: 200, // Ensure it has some minimum height
  },
  emptyStateTitle: {
    fontSize: 18, // Adjusted size
    fontWeight: '600', // Adjusted weight
    marginBottom: 8, // Adjusted spacing
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 14, // Adjusted size
    textAlign: 'center',
    lineHeight: 20, // Adjusted line height
    // color managed by theme
  },
  // Removed unused styles: actionButton, actionButtonText, toolImageContainer, etc.
});