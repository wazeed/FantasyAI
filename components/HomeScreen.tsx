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
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 2 - 20;

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
  const { signOut } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  const [categories, setCategories] = useState(CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const searchInputRef = useRef(null);
  
  // Dynamic colors based on theme
  const colors = {
    background: isDarkMode ? '#121212' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    subText: isDarkMode ? '#AAAAAA' : '#666666',
    card: isDarkMode ? '#1E1E1E' : '#F5F5F5',
    cardBorder: isDarkMode ? '#333333' : '#E0E0E0',
    accent: isDarkMode ? '#3D8CFF' : '#4F46E5',
    categoryBg: isDarkMode ? '#2A2A2A' : '#F0F0F0',
    categorySelected: isDarkMode ? '#3D8CFF' : '#4F46E5',
    categoryText: isDarkMode ? '#FFFFFF' : '#000000',
    searchBg: isDarkMode ? '#2A2A2A' : '#F0F0F0',
    tagBg: isDarkMode ? 'rgba(79,70,229,0.15)' : 'rgba(79,70,229,0.1)',
    tagText: isDarkMode ? '#3D8CFF' : '#4F46E5',
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

  const handleCharacterPress = (character) => {
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
      style={[styles.characterItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} 
      onPress={() => handleCharacterPress(item)}
    >
      <View style={styles.characterImageWrapper}>
        <Image source={item.image} style={styles.characterImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageGradient}
        />
        <View style={styles.followersContainer}>
          <Text style={styles.followersEmoji}>💬</Text>
          <Text style={styles.followersText}>{item.followers}</Text>
        </View>
      </View>
      
      <View style={styles.characterContent}>
        <View style={styles.nameRow}>
          <Text style={[styles.characterName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        
        <Text 
          style={[styles.characterDescription, { color: colors.subText }]} 
          numberOfLines={2}
        >
          {item.description}
        </Text>
        
        <View style={styles.tagContainer}>
          {item.tags.slice(0, 3).map(tag => renderTagItem(tag))}
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
      
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <Text style={[styles.title, { color: colors.text }]}>Fantasy AI</Text>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.headerButton, { backgroundColor: colors.buttonBg }]}
            onPress={navigateToHelpCenter}
          >
            <Ionicons name="help-circle-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.headerButton, { backgroundColor: colors.buttonBg }]}
            onPress={focusSearchInput}
          >
            <Ionicons name="search-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.headerButton, { backgroundColor: colors.buttonBg }]} 
            onPress={navigateToProfile}
          >
            <Ionicons name="person-outline" size={22} color={colors.text} />
          </TouchableOpacity>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginRight: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 2,
  },
  categoriesContainer: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  categoryItemSelected: {
    borderWidth: 0,
  },
  categoryText: {
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  charactersList: {
    paddingBottom: 20,
  },
  characterItem: {
    width: COLUMN_WIDTH,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  characterImageWrapper: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  characterImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  followersContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  followersEmoji: {
    fontSize: 12,
    marginRight: 4,
    color: '#FFFFFF',
  },
  followersText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  characterContent: {
    padding: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  characterName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  characterDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tagItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
}); 