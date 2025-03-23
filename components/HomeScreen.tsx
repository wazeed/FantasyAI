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
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 2 - 24;

// Mock data for characters
const CHARACTERS = [
  {
    id: '1',
    name: 'Max',
    description: 'Max is a 27-year-old man who is your brother\'s friend but he has hatred for you',
    image: require('../assets/char1.png'),
    tags: ['Cold', 'Loyal', 'Flirtatious', 'Jealous'],
    followers: '1.8M',
    category: 'Original'
  },
  {
    id: '2',
    name: 'Yuto',
    description: 'You have autism. You are Yuto\'s wife he is 25 years old and you are 21 years old',
    image: require('../assets/char2.png'),
    tags: ['Protective', 'Gentle', 'Romance', 'Billionaire'],
    followers: '1.8M',
    category: 'Original'
  },
  {
    id: '3',
    name: 'Axel',
    description: 'Did the exchange player fall in love with you? 🇺🇸 🇧🇷 ❤️',
    image: require('../assets/char3.png'),
    tags: ['Dominant', 'Romance', 'First Love', 'Sharp-tongued'],
    followers: '11.5M',
    category: 'Original'
  },
  {
    id: '4',
    name: 'Charlotte',
    description: 'Your cousin who is over for the weekend',
    image: require('../assets/char4.png'),
    tags: ['Playful', 'Mischievous', 'Family'],
    followers: '6.7M',
    category: 'Original'
  },
  {
    id: '5',
    name: 'Paulo',
    description: 'Can I play ball with the mlk...',
    image: require('../assets/char5.png'),
    tags: ['Text Game', 'Loyal', 'Gentle', 'Jealous'],
    followers: '3.5M',
    category: 'Original'
  },
  {
    id: '6',
    name: 'Nishimura Riki',
    description: 'Riki | forced marriage for our dad\'s companies 💮',
    image: require('../assets/char6.png'),
    tags: ['Elegant', 'Movies&TV', 'Romance'],
    followers: '1.9M',
    category: 'Original'
  },
  {
    id: '7',
    name: 'Biker Boy',
    description: 'He is very selfish but kinda sweet.',
    image: require('../assets/char7.png'),
    tags: ['OC', 'Student', 'Cold', 'Gentle', 'Badboy'],
    followers: '16.3M',
    category: 'Original'
  },
  {
    id: '8',
    name: 'Sarah',
    description: 'Your friends younger sister who you\'re taking to the gym.',
    image: require('../assets/char8.png'),
    tags: ['Sweet', 'Cute', 'Pure', 'Dedicated'],
    followers: '4.2M',
    category: 'Original'
  },
  {
    id: '9',
    name: 'Professor James',
    description: 'Your strict but fair history professor with a mysterious past',
    image: require('../assets/char9.png'),
    tags: ['Intellectual', 'Strict', 'Mentor', 'Mysterious'],
    followers: '2.7M',
    category: 'Original'
  },
  {
    id: '10',
    name: 'Kai',
    description: 'A surfing instructor you met on vacation who seems to be hiding something',
    image: require('../assets/char10.png'),
    tags: ['Carefree', 'Athletic', 'Secretive', 'Charming'],
    followers: '8.1M',
    category: 'Original'
  },
  
  // Fantasy Characters
  {
    id: 'fantasy1',
    name: 'Gandalf',
    description: 'The wise wizard from Middle Earth who guides heroes on their journey',
    image: require('../assets/character/fantasy1.png'),
    tags: ['Wise', 'Powerful', 'Mysterious', 'Mentor'],
    followers: '15.2M',
    category: 'Fantasy'
  },
  {
    id: 'fantasy2',
    name: 'Daenerys Targaryen',
    description: 'The Mother of Dragons and rightful heir to the Iron Throne',
    image: require('../assets/character/fantasy2.png'),
    tags: ['Determined', 'Royal', 'Dragons', 'Conqueror'],
    followers: '18.7M',
    category: 'Fantasy'
  },
  {
    id: 'fantasy3',
    name: 'Harry Potter',
    description: 'The Boy Who Lived and the Chosen One of the wizarding world',
    image: require('../assets/character/fantasy3.png'),
    tags: ['Brave', 'Wizard', 'Chosen One', 'Loyal'],
    followers: '22.3M',
    category: 'Fantasy'
  },
  {
    id: 'fantasy4',
    name: 'Aragorn',
    description: 'The rightful King of Gondor and leader of the Rangers of the North',
    image: require('../assets/character/fantasy4.png'),
    tags: ['Ranger', 'King', 'Warrior', 'Noble'],
    followers: '12.8M',
    category: 'Fantasy'
  },
  {
    id: 'fantasy5',
    name: 'Galadriel',
    description: 'The powerful Elven Queen with ancient wisdom and magical abilities',
    image: require('../assets/character/fantasy5.png'),
    tags: ['Elf', 'Queen', 'Magical', 'Ancient'],
    followers: '9.4M',
    category: 'Fantasy'
  },
  
  // Historical Characters
  {
    id: 'historical1',
    name: 'Cleopatra',
    description: 'The last active ruler of the Ptolemaic Kingdom of Egypt',
    image: require('../assets/character/historical1.png'),
    tags: ['Queen', 'Ruler', 'Intelligent', 'Strategic'],
    followers: '14.2M',
    category: 'Historical'
  },
  {
    id: 'historical2',
    name: 'Julius Caesar',
    description: 'Roman general and statesman who played a critical role in the events that led to the demise of the Roman Republic',
    image: require('../assets/character/historical2.png'),
    tags: ['Emperor', 'Conqueror', 'Military', 'Leader'],
    followers: '13.5M',
    category: 'Historical'
  },
  {
    id: 'historical3',
    name: 'Leonardo da Vinci',
    description: 'Italian polymath whose areas of interest included invention, drawing, painting, sculpture, architecture, science, music, mathematics, engineering, and more',
    image: require('../assets/character/historical3.png'),
    tags: ['Genius', 'Artist', 'Inventor', 'Renaissance'],
    followers: '16.7M',
    category: 'Historical'
  },
  {
    id: 'historical4',
    name: 'Marie Antoinette',
    description: 'The last Queen of France before the French Revolution',
    image: require('../assets/character/historical4.png'),
    tags: ['Queen', 'French', 'Aristocrat', 'Tragic'],
    followers: '10.3M',
    category: 'Historical'
  },
  {
    id: 'historical5',
    name: 'Genghis Khan',
    description: 'Founder and first Great Khan and Emperor of the Mongol Empire',
    image: require('../assets/character/historical5.png'),
    tags: ['Conqueror', 'Emperor', 'Warrior', 'Ruler'],
    followers: '11.9M',
    category: 'Historical'
  },
  
  // Professional Characters
  {
    id: 'professional1',
    name: 'Dr. Sarah Chen',
    description: 'Brilliant neurosurgeon who saves lives while battling her own personal demons',
    image: require('../assets/character/professional1.png'),
    tags: ['Doctor', 'Genius', 'Dedicated', 'Compassionate'],
    followers: '8.6M',
    category: 'Professional'
  },
  {
    id: 'professional2',
    name: 'Prof. James Wilson',
    description: 'Renowned psychology professor with unconventional teaching methods',
    image: require('../assets/character/professional2.png'),
    tags: ['Academic', 'Mentor', 'Eccentric', 'Brilliant'],
    followers: '7.2M',
    category: 'Professional'
  },
  {
    id: 'professional3',
    name: 'Chef Antonio',
    description: 'Passionate Italian chef with a flair for the dramatic and incredible culinary skills',
    image: require('../assets/character/professional3.png'),
    tags: ['Chef', 'Creative', 'Passionate', 'Temperamental'],
    followers: '9.1M',
    category: 'Professional'
  },
  {
    id: 'professional4',
    name: 'Detective Morgan',
    description: 'Hard-boiled detective with a perfect case record and troubled past',
    image: require('../assets/character/professional4.png'),
    tags: ['Detective', 'Sharp', 'Tenacious', 'Mysterious'],
    followers: '10.5M',
    category: 'Professional'
  },
  {
    id: 'professional5',
    name: 'Astronaut Zhang',
    description: 'Pioneering astronaut who has made incredible discoveries in deep space',
    image: require('../assets/character/professional5.png'),
    tags: ['Astronaut', 'Explorer', 'Brave', 'Scientific'],
    followers: '12.3M',
    category: 'Professional'
  },
  
  // Fictional Characters
  {
    id: 'fictional1',
    name: 'Sherlock Holmes',
    description: 'The legendary detective with extraordinary powers of observation and deduction',
    image: require('../assets/character/fictional1.png'),
    tags: ['Detective', 'Genius', 'Observant', 'Eccentric'],
    followers: '19.8M',
    category: 'Fictional'
  },
  {
    id: 'fictional2',
    name: 'Elizabeth Bennet',
    description: 'The witty and independent protagonist from Pride and Prejudice',
    image: require('../assets/character/fictional2.png'),
    tags: ['Witty', 'Independent', 'Intelligent', 'Spirited'],
    followers: '8.4M',
    category: 'Fictional'
  },
  {
    id: 'fictional3',
    name: 'Jay Gatsby',
    description: 'The mysterious millionaire with a passionate obsession for his former love',
    image: require('../assets/character/fictional3.png'),
    tags: ['Wealthy', 'Mysterious', 'Romantic', 'Tragic'],
    followers: '9.2M',
    category: 'Fictional'
  },
  {
    id: 'fictional4',
    name: 'Atticus Finch',
    description: 'The moral hero of To Kill a Mockingbird, fighting for justice in the American South',
    image: require('../assets/character/fictional4.png'),
    tags: ['Lawyer', 'Honorable', 'Wise', 'Compassionate'],
    followers: '7.5M',
    category: 'Fictional'
  },
  {
    id: 'fictional5',
    name: 'Captain Ahab',
    description: 'The obsessed captain hunting the white whale that took his leg',
    image: require('../assets/character/fictional5.png'),
    tags: ['Captain', 'Obsessed', 'Vengeful', 'Determined'],
    followers: '6.8M',
    category: 'Fictional'
  },
  
  // Anime Characters
  {
    id: 'anime1',
    name: 'Spike Spiegel',
    description: 'Former hitman turned bounty hunter with a cool attitude and dark past',
    image: require('../assets/character/anime1.png'),
    tags: ['Bounty Hunter', 'Cool', 'Fighter', 'Mysterious'],
    followers: '13.7M',
    category: 'Anime'
  },
  {
    id: 'anime2',
    name: 'Sailor Moon',
    description: 'Magical girl who transforms to fight for love and justice',
    image: require('../assets/character/anime2.png'),
    tags: ['Magical Girl', 'Hero', 'Loving', 'Powerful'],
    followers: '15.9M',
    category: 'Anime'
  },
  {
    id: 'anime3',
    name: 'Goku',
    description: 'Super-powered Saiyan warrior who constantly seeks greater strength',
    image: require('../assets/character/anime3.png'),
    tags: ['Fighter', 'Powerful', 'Optimistic', 'Hero'],
    followers: '24.6M',
    category: 'Anime'
  },
  {
    id: 'anime4',
    name: 'Levi Ackerman',
    description: 'Humanity\'s strongest soldier with an intense focus on duty',
    image: require('../assets/character/anime4.png'),
    tags: ['Soldier', 'Strong', 'Serious', 'Skilled'],
    followers: '19.2M',
    category: 'Anime'
  },
  {
    id: 'anime5',
    name: 'Mikasa Ackerman',
    description: 'Extremely skilled fighter with unwavering loyalty to those she loves',
    image: require('../assets/character/anime5.png'),
    tags: ['Soldier', 'Loyal', 'Skilled', 'Protective'],
    followers: '17.8M',
    category: 'Anime'
  },
  
  // Celebrity Characters
  {
    id: 'celebrity1',
    name: 'Marilyn Monroe',
    description: 'Iconic actress and model of the Golden Age of Hollywood',
    image: require('../assets/character/celebrity1.png'),
    tags: ['Actress', 'Icon', 'Glamorous', 'Mysterious'],
    followers: '20.3M',
    category: 'Celebrity'
  },
  {
    id: 'celebrity2',
    name: 'Elvis Presley',
    description: 'The King of Rock and Roll who changed music forever',
    image: require('../assets/character/celebrity2.png'),
    tags: ['Musician', 'Icon', 'King', 'Charismatic'],
    followers: '18.5M',
    category: 'Celebrity'
  },
  {
    id: 'celebrity3',
    name: 'Audrey Hepburn',
    description: 'Elegant film and fashion icon known for her humanitarian work',
    image: require('../assets/character/celebrity3.png'),
    tags: ['Actress', 'Elegant', 'Icon', 'Humanitarian'],
    followers: '16.2M',
    category: 'Celebrity'
  },
  {
    id: 'celebrity4',
    name: 'Bruce Lee',
    description: 'Legendary martial artist and actor who revolutionized action cinema',
    image: require('../assets/character/celebrity4.png'),
    tags: ['Martial Artist', 'Actor', 'Philosopher', 'Icon'],
    followers: '21.7M',
    category: 'Celebrity'
  },
  {
    id: 'celebrity5',
    name: 'Frida Kahlo',
    description: 'Revolutionary Mexican artist known for her unique style and self-portraits',
    image: require('../assets/character/celebrity5.png'),
    tags: ['Artist', 'Iconic', 'Revolutionary', 'Passionate'],
    followers: '14.9M',
    category: 'Celebrity'
  },
  
  // Scientist Characters
  {
    id: 'scientists1',
    name: 'Albert Einstein',
    description: 'Revolutionary physicist who developed the theory of relativity',
    image: require('../assets/character/scientists1.png'),
    tags: ['Genius', 'Physicist', 'Revolutionary', 'Eccentric'],
    followers: '22.1M',
    category: 'Scientists'
  },
  {
    id: 'scientists2',
    name: 'Marie Curie',
    description: 'Pioneering physicist and chemist who discovered radium and polonium',
    image: require('../assets/character/scientists2.png'),
    tags: ['Nobel Prize', 'Physicist', 'Chemist', 'Pioneer'],
    followers: '17.3M',
    category: 'Scientists'
  },
  {
    id: 'scientists3',
    name: 'Isaac Newton',
    description: 'Mathematician, physicist, and astronomer who formulated the laws of motion and gravity',
    image: require('../assets/character/scientists3.png'),
    tags: ['Genius', 'Mathematician', 'Physicist', 'Discoverer'],
    followers: '15.8M',
    category: 'Scientists'
  },
  {
    id: 'scientists4',
    name: 'Nikola Tesla',
    description: 'Brilliant inventor who pioneered electrical engineering',
    image: require('../assets/character/scientists4.png'),
    tags: ['Inventor', 'Genius', 'Visionary', 'Eccentric'],
    followers: '19.5M',
    category: 'Scientists'
  },
  {
    id: 'scientists5',
    name: 'Ada Lovelace',
    description: 'First computer programmer and visionary who foresaw the potential of computing machines',
    image: require('../assets/character/scientists5.png'),
    tags: ['Programmer', 'Visionary', 'Mathematician', 'Pioneer'],
    followers: '13.6M',
    category: 'Scientists'
  },
];

// Categories for the horizontal scroll
const CATEGORIES = [
  { id: 'all', name: 'All', selected: true },
  { id: 'original', name: 'Original', selected: false },
  { id: 'fantasy', name: 'Fantasy', selected: false },
  { id: 'historical', name: 'Historical', selected: false },
  { id: 'professional', name: 'Professional', selected: false },
  { id: 'fictional', name: 'Fictional', selected: false },
  { id: 'anime', name: 'Anime', selected: false },
  { id: 'celebrity', name: 'Celebrity', selected: false },
  { id: 'scientists', name: 'Scientists', selected: false },
];

export default function HomeScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const { isGuest, shouldShowDiscountOffer, markDiscountOfferShown, signOut } = useAuth();
  const [categories, setCategories] = useState(CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const searchInputRef = useRef(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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

  const handleCategoryPress = (selectedId) => {
    const updated = categories.map(cat => ({
      ...cat,
      selected: cat.id === selectedId
    }));
    setCategories(updated);
    setSelectedCategory(selectedId);
  };

  const handleCharacterPress = async (character) => {
    if (isGuest) {
      // For guest users, check if we should show the discount offer
      try {
        const shouldShow = await shouldShowDiscountOffer();
        
        if (shouldShow) {
          console.log('Showing discount offer screen');
          // Mark that we've shown the offer today
          await markDiscountOfferShown();
          // Navigate to discount offer screen
          navigation.navigate('DiscountOfferScreen', { fromCharacter: true, character });
          return;
        }
      } catch (error) {
        console.error('Error checking discount offer status:', error);
      }
    }
    
    // Otherwise proceed to chat
    navigation.navigate('Chat', { character });
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

  const renderCategoryItem = ({ item }) => (
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

  const renderTagItem = (tag) => (
    <View key={tag} style={[styles.tagItem, { backgroundColor: colors.tagBg }]}>
      <Text style={[styles.tagText, { color: colors.tagText }]}>{tag}</Text>
    </View>
  );

  const renderCharacterItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.characterCard,
        { width: COLUMN_WIDTH },
        isDarkMode ? styles.darkCard : styles.lightCard
      ]}
      onPress={() => handleCharacterPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.characterImageContainer}>
        <Image source={item.image} style={styles.characterImage} />
        <View style={[styles.categoryTag, { backgroundColor: colors.accent }]}>
          <Text style={[styles.categoryTagText, { color: '#FFFFFF' }]}>{item.category}</Text>
        </View>
      </View>
      
      <View style={styles.characterInfo}>
        <Text style={[styles.characterName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        
        <Text style={[styles.characterDescription, { color: colors.subText }]} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag) => renderTagItem(tag))}
        </View>
        
        <View style={styles.characterMeta}>
          <View style={styles.followerCount}>
            <Ionicons name="people-outline" size={14} color={colors.subText} />
            <Text style={[styles.followerText, { color: colors.subText }]}>
              {item.followers}
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.chatButton, { backgroundColor: colors.accent }]} 
            onPress={() => handleCharacterPress(item)}
          >
            <Text style={styles.chatButtonText}>Chat</Text>
            <Ionicons name="chatbubble-outline" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const filteredCharacters = searchQuery 
    ? CHARACTERS.filter(char => 
        (selectedCategory === 'all' || char.category.toLowerCase() === selectedCategory.toLowerCase()) &&
        (char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        char.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        char.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
      )
    : selectedCategory === 'all' 
      ? CHARACTERS 
      : CHARACTERS.filter(char => char.category.toLowerCase() === selectedCategory.toLowerCase());

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
          placeholder="Search characters..."
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
        data={filteredCharacters}
        renderItem={renderCharacterItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.charactersList}
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
  charactersList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  characterCard: {
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
  characterImageContainer: {
    position: 'relative',
    height: 180,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  characterImage: {
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
  characterInfo: {
    padding: 14,
  },
  characterName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  characterDescription: {
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
  characterMeta: {
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