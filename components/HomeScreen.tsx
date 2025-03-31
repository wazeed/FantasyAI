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
  ScrollView,
  Animated,
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
  image: any;
  tags: string[];
  followers: string;
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
    avatar: any;
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
const COLUMN_WIDTH = width / 2 - 24;

// New tools/categories data
const TOOLS = [
  {
    id: 'self-growth',
    name: 'Self-Growth',
    description: 'Become a better version of yourself',
    image: require('../assets/char1.png'),
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
    card: isDarkMode ? '#1E1E1E' : '#F5F5F5',
    cardBorder: isDarkMode ? '#333333' : '#E0E0E0',
    accent: isDarkMode ? '#3D8CFF' : '#7E3AF2',
    categoryBg: isDarkMode ? '#2A2A2A' : '#F0F0F0',
    categorySelected: isDarkMode ? '#3D8CFF' : '#7E3AF2',
    categoryText: isDarkMode ? '#FFFFFF' : '#000000',
    searchBg: isDarkMode ? '#2A2A2A' : '#F0F0F0',
    tagBg: isDarkMode ? 'rgba(79,70,229,0.15)' : 'rgba(126,58,242,0.1)',
    tagText: isDarkMode ? '#3D8CFF' : '#7E3AF2',
    buttonBg: isDarkMode ? '#2A2A2A' : '#F0F0F0',
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
              avatar: tool.image,
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
        avatar: tool.image,
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

  const renderTagItem = (tag: string) => (
    <View style={[styles.tagItem, { backgroundColor: colors.tagBg }]}>
      <Text style={[styles.tagText, { color: colors.tagText }]}>{tag}</Text>
    </View>
  );

  const renderToolItem = ({ item }: { item: Tool }) => (
    <TouchableOpacity
      style={[
        styles.toolCard,
        { width: COLUMN_WIDTH },
        isDarkMode ? styles.darkCard : styles.lightCard
      ]}
      onPress={() => handleToolPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.toolImageContainer}>
        <Image source={item.image} style={styles.toolImage} />
        <View style={[styles.categoryTag, { backgroundColor: colors.accent }]}>
          <Text style={[styles.categoryTagText, { color: '#FFFFFF' }]}>{item.category}</Text>
        </View>
      </View>
      
      <View style={styles.toolInfo}>
        <Text style={[styles.toolName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        
        <Text style={[styles.toolDescription, { color: colors.subText }]} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, index) =>
            <View key={`${item.id}-tag-${index}`}>
              {renderTagItem(tag)}
            </View>
          )}
        </View>
        
        <View style={styles.toolMeta}>
          <View style={styles.followerCount}>
            <Ionicons name="people-outline" size={14} color={colors.subText} />
            <Text style={[styles.followerText, { color: colors.subText }]}>
              {item.followers}
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.chatButton, { backgroundColor: colors.accent }]} 
            onPress={() => handleToolPress(item)}
          >
            <Text style={styles.chatButtonText}>Use</Text>
            <Ionicons name="chatbubble-outline" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

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
        renderItem={renderToolItem}
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
    backgroundColor: '#FFFFFF',
  },
  darkContainer: {
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
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  darkSearchContainer: {
    backgroundColor: '#2A2A2A',
    borderColor: '#3A3A3A',
  },
  lightSearchContainer: {
    backgroundColor: '#F5F5F5',
    borderColor: '#EEEEEE',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  darkSearchInput: {
    color: '#FFFFFF',
  },
  lightSearchInput: {
    color: '#000000',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  darkSectionTitle: {
    color: '#FFFFFF',
  },
  lightSectionTitle: {
    color: '#000000',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    marginRight: 4,
  },
  darkViewAllText: {
    color: '#0070F3',
  },
  lightViewAllText: {
    color: '#0070F3',
  },
  categoriesList: {
    paddingLeft: 20,
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  categoryItemSelected: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextSelected: {
    fontSize: 14,
    fontWeight: '600',
  },
  toolsList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  toolCard: {
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4.65,
    elevation: 6,
  },
  darkCard: {
    backgroundColor: '#1E1E1E',
  },
  lightCard: {
    backgroundColor: '#FFFFFF',
  },
  toolImageContainer: {
    position: 'relative',
    height: 180,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  toolImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  toolInfo: {
    padding: 14,
  },
  toolName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tagItem: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  toolMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  followerCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followerText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '500',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateImage: {
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
  actionButton: {
    backgroundColor: '#0070F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});