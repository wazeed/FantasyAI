import React, { useState, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
  TextInput,
  ScrollView, // Keep ScrollView if needed for categories, otherwise remove
  Animated, // Keep Animated import if needed elsewhere, or remove if not
  RefreshControl,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// Define types for our data structures
type Tool = {
  id: string;
  name: string;
  description: string;
  image: any; // Keep for now, needed for navigation params
  tags: string[];
  followers: string; // Keep for now, might remove if completely unused
  category: string;
  suggestedQuestions: string[];
};

type Category = {
  id: string;
  name: string;
  selected: boolean;
};

type RootStackParamList = {
  Home: undefined;
  Chat: { character: {
    id: string;
    name: string;
    avatar: any; // Keep image for chat screen compatibility for now
    description?: string;
    tags?: string[];
    category?: string;
  }};
  DiscountOfferScreen: {
    fromCharacter: boolean;
    character: {
      id: string;
      name: string;
      avatar: any;
      description?: string;
      tags?: string[];
      category?: string;
    }
  };
  Profile: undefined;
  HelpCenter: undefined;
};

type HomeScreenProps = {
  navigation: BottomTabNavigationProp<RootStackParamList, 'Home'>;
};

const { width } = Dimensions.get('window');
// Adjusted column width calculation for better spacing
const PADDING_HORIZONTAL = 16;
const GAP = 16;
const NUM_COLUMNS = 2;
const COLUMN_WIDTH = (width - PADDING_HORIZONTAL * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;


// New tools/categories data (Keep original data structure for now)
const TOOLS = [
  {
    id: 'self-growth',
    name: 'Self-Growth',
    description: 'Become a better version of yourself',
    image: require('../assets/char1.png'), // Keep image ref for now
    tags: ['Personal', 'Development', 'Improvement'],
    followers: '1.2M',
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
    followers: '980K',
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
    followers: '1.5M',
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
    followers: '2.3M',
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
    followers: '1.8M',
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
    followers: '1.1M',
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
    followers: '890K',
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
    followers: '1.4M',
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
    followers: '1.6M',
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
    followers: '1.3M',
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
    followers: '950K',
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
    followers: '1.7M',
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
    followers: '1.2M',
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
    followers: '2.1M',
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
    followers: '1.5M',
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
    followers: '1.1M',
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
    followers: '1.8M',
    category: 'Productivity',
    suggestedQuestions: [
      "How many languages does the translator support?",
      "Can it translate spoken conversations in real-time?",
      "How accurate are the translations?",
      "Does it work offline for common languages?"
    ]
  }
];

// Categories for the horizontal scroll
const CATEGORIES = [
  { id: 'all', name: 'All', selected: true },
  { id: 'life', name: 'Life', selected: false },
  { id: 'health', name: 'Health', selected: false },
  { id: 'work', name: 'Work', selected: false },
  { id: 'creative', name: 'Creative', selected: false },
  { id: 'education', name: 'Education', selected: false },
  { id: 'marketing', name: 'Marketing', selected: false },
  { id: 'productivity', name: 'Productivity', selected: false },
  { id: 'entertainment', name: 'Entertainment', selected: false },
];

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { isDarkMode } = useContext(ThemeContext);
  const { isGuest, shouldShowDiscountOffer, markDiscountOfferShown, signOut } = useAuth();
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const searchInputRef = useRef<TextInput>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Dynamic colors based on theme
  const colors = {
    background: isDarkMode ? '#121212' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    subText: isDarkMode ? '#AAAAAA' : '#666666',
    card: isDarkMode ? '#1E1E1E' : '#FFFFFF', // Use white for light mode cards
    cardBorder: isDarkMode ? '#333333' : '#E0E0E0', // Lighter border for light mode
    accent: isDarkMode ? '#3D8CFF' : '#7E3AF2',
    categoryBg: isDarkMode ? '#2A2A2A' : '#F0F0F0',
    categorySelected: isDarkMode ? '#3D8CFF' : '#7E3AF2',
    categoryText: isDarkMode ? '#FFFFFF' : '#000000',
    searchBg: isDarkMode ? '#2A2A2A' : '#F0F0F0',
    // Removed tag styles as they are no longer used
    buttonBg: isDarkMode ? '#2A2A2A' : '#F0F0F0',
  };

  // Icon mapping for tools (defined inside component scope)
  const TOOL_ICONS: { [key: string]: { name: keyof typeof Ionicons.glyphMap; color: string } } = {
    'self-growth': { name: 'ribbon-outline', color: '#34D399' }, // Teal/Green
    'lifestyle': { name: 'sunny-outline', color: '#FBBF24' }, // Yellow/Orange
    'spirituality': { name: 'sparkles-outline', color: '#A78BFA' }, // Purple
    'fitness': { name: 'barbell-outline', color: '#EF4444' }, // Red
    'career': { name: 'briefcase-outline', color: '#60A5FA' }, // Blue
    'emails': { name: 'mail-outline', color: '#93C5FD' }, // Light Blue
    'lyrics-poetry': { name: 'musical-notes-outline', color: '#F472B6' }, // Pink
    'fun': { name: 'game-controller-outline', color: '#EC4899' }, // Magenta
    'link-ask': { name: 'link-outline', color: '#2DD4BF' }, // Cyan
    'languages': { name: 'language-outline', color: '#818CF8' }, // Indigo
    'math': { name: 'calculator-outline', color: '#F87171' }, // Light Red
    'ai-learning': { name: 'school-outline', color: '#6EE7B7' }, // Light Green
    'school': { name: 'library-outline', color: '#FCD34D' }, // Amber
    'social-media': { name: 'share-social-outline', color: '#A5B4FC' }, // Light Indigo
    'quote-maker': { name: 'chatbubble-ellipses-outline', color: '#C4B5FD' }, // Light Purple
    'ai-scanner': { name: 'scan-outline', color: '#7DD3FC' }, // Sky Blue
    'translator': { name: 'swap-horizontal-outline', color: '#FDA4AF' }, // Light Pink
  };

  const handleCategoryPress = (selectedId: string) => {
    const updated = categories.map(cat => ({
      ...cat,
      selected: cat.id === selectedId
    }));
    setCategories(updated);
    setSelectedCategory(selectedId);
  };

  const handleToolPress = async (tool: Tool) => {
    if (isGuest) {
      // For guest users, check if we should show the discount offer
      try {
        const shouldShow = await shouldShowDiscountOffer();
        
        if (shouldShow) {
          console.log('Showing discount offer screen');
          // Mark that we've shown the offer today
          await markDiscountOfferShown();
          // Navigate to discount offer screen
          navigation.navigate('DiscountOfferScreen', {
            fromCharacter: true,
            character: {
              id: tool.id,
              name: tool.name,
              avatar: tool.image, // Keep image for now for chat screen
              description: tool.description,
              tags: tool.tags,
              category: tool.category
            }
          });
          return;
        }
      } catch (error) {
        console.error('Error checking discount offer status:', error);
      }
    }
    
    // Otherwise proceed to tool - map tool to character format
    navigation.navigate('Chat', {
      character: {
        id: tool.id,
        name: tool.name,
        avatar: tool.image, // Keep image for now for chat screen
        description: tool.description,
        tags: tool.tags,
        category: tool.category
      }
    });
  };

  const navigateToProfile = () => {
    navigation.navigate('Profile');
  };

  const navigateToHelpCenter = () => {
    navigation.navigate('HelpCenter');
  };

  const focusSearchInput = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        { backgroundColor: item.selected ? colors.categorySelected : colors.categoryBg },
        item.selected && styles.categoryItemSelected
      ]}
      onPress={() => handleCategoryPress(item.id)}
    >
      <Text 
        style={[
          styles.categoryText, 
          { color: item.selected ? '#FFFFFF' : colors.subText },
          item.selected && styles.categoryTextSelected
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // Define renderToolItem inside the component to access scope
  const renderToolItem = ({ item }: { item: Tool }) => {
    const iconInfo = TOOL_ICONS[item.id] || { name: 'help-circle-outline', color: colors.accent };

    return (
      <TouchableOpacity
        style={[
          styles.toolCard,
          { width: COLUMN_WIDTH },
          isDarkMode ? styles.darkCard : styles.lightCard
        ]}
        onPress={() => handleToolPress(item)}
        activeOpacity={0.8}
      >
        {/* Icon Container */}
        <View style={[styles.iconContainer, { backgroundColor: iconInfo.color }]}>
          <Ionicons 
            name={iconInfo.name} 
            size={32} // Consistent icon size
            color="#FFFFFF" // White icon color
          />
        </View>
        
        <View style={styles.toolInfo}>
          <Text style={[styles.toolName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          
          <Text style={[styles.toolDescription, { color: colors.subText }]} numberOfLines={2}>
            {item.description}
          </Text>
          
          {/* Tags and Meta removed */}
        </View>
      </TouchableOpacity>
    );
  };

  const filteredTools = searchQuery 
    ? TOOLS.filter(tool => 
        (selectedCategory === 'all' || tool.category.toLowerCase() === selectedCategory.toLowerCase()) &&
        (tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
      )
    : selectedCategory === 'all' 
      ? TOOLS 
      : TOOLS.filter(tool => tool.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <View style={[styles.header, isDarkMode ? styles.darkHeader : styles.lightHeader]}>
        <View style={styles.headerLeft}>
          <Image source={require('../assets/logo.png')} style={styles.logo} />
          <Text style={[styles.appName, isDarkMode ? styles.darkAppName : styles.lightAppName]}>
            Fantasy AI
          </Text>
        </View>
      </View>
      
      <View style={[styles.searchContainer, { backgroundColor: colors.searchBg }]}>
        <Ionicons name="search-outline" size={18} color={colors.subText} style={{marginRight: 8}} />
        <TextInput
          ref={searchInputRef}
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search tools..."
          placeholderTextColor={colors.subText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.subText} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>
      
      <FlatList
        data={filteredTools}
        renderItem={renderToolItem} // Use the new renderToolItem
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.toolsList}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.columnWrapper}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor managed by theme
  },
  darkContainer: { // Keep for potential future use if needed elsewhere
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
  logo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
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
    marginHorizontal: PADDING_HORIZONTAL, // Use constant
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#333333', // Default border, adjust if needed
  },
  darkSearchContainer: {
    backgroundColor: '#2A2A2A',
    borderColor: '#3A3A3A',
  },
  lightSearchContainer: {
    backgroundColor: '#F5F5F5',
    borderColor: '#EEEEEE',
  },
  searchIcon: { // Keep if needed, though icon is directly in JSX now
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  darkSearchInput: { // Keep for potential theme adjustments
    color: '#FFFFFF',
  },
  lightSearchInput: { // Keep for potential theme adjustments
    color: '#000000',
  },
  sectionHeader: { // Keep if needed elsewhere
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PADDING_HORIZONTAL,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: { // Keep if needed elsewhere
    fontSize: 20,
    fontWeight: '700',
  },
  darkSectionTitle: { // Keep if needed elsewhere
    color: '#FFFFFF',
  },
  lightSectionTitle: { // Keep if needed elsewhere
    color: '#000000',
  },
  viewAllButton: { // Keep if needed elsewhere
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: { // Keep if needed elsewhere
    fontSize: 14,
    marginRight: 4,
  },
  darkViewAllText: { // Keep if needed elsewhere
    color: '#0070F3',
  },
  lightViewAllText: { // Keep if needed elsewhere
    color: '#0070F3',
  },
  categoriesList: {
    paddingLeft: PADDING_HORIZONTAL,
    paddingRight: PADDING_HORIZONTAL - 12, // Adjust for last item margin
    marginBottom: 16,
  },
  categoriesContainer: {
    // Removed as FlatList handles horizontal layout now
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  categoryItemSelected: {
    // Can potentially merge with categoryItem if only background changes
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextSelected: {
    fontWeight: '600', // Make selected bolder
  },
  toolsList: {
    paddingHorizontal: PADDING_HORIZONTAL,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    // Removed paddingHorizontal, handled by toolsList padding and GAP
  },
  toolCard: {
    marginBottom: GAP, // Use GAP constant
    borderRadius: 16,
    overflow: 'hidden', // Keep overflow hidden
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    // Width is set dynamically
  },
  darkCard: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1, // Add subtle border in dark mode
    borderColor: '#2A2A2A',
  },
  lightCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1, // Add subtle border in light mode
    borderColor: '#F0F0F0',
  },
  iconContainer: { // Added style for icon container
    width: 56, // Match reference image size
    height: 56,
    borderRadius: 12, // Rounded square
    justifyContent: 'center',
    alignItems: 'center',
    // alignSelf: 'flex-start', // Align icon to the start of the card - Removed for centering
    margin: 14, // Add margin around the icon container
    marginBottom: 8, // Reduced bottom margin
  },
  toolInfo: {
    paddingHorizontal: 14, // Horizontal padding
    paddingBottom: 14, // Bottom padding
    paddingTop: 0, // Remove top padding as icon is above
  },
  toolName: {
    fontSize: 16, // Slightly smaller font size
    fontWeight: '600', // Medium weight
    marginBottom: 4,
    textAlign: 'left', // Align text left
  },
  toolDescription: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'left', // Align text left
    // Removed marginBottom
  },
  // Removed unused styles: toolImageContainer, toolImage, categoryTag, categoryTagText, tagsContainer, tagItem, tagText, toolMeta, followerCount, followerText, chatButton, chatButtonText
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 40, // Add some margin from categories
  },
  emptyStateImage: { // Keep if you add an image later
    width: 120,
    height: 120,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  actionButton: { // Keep if needed for empty state
    backgroundColor: '#0070F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  actionButtonText: { // Keep if needed for empty state
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});