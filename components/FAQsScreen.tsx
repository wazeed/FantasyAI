import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation'; // Adjust path as needed

// --- Interfaces ---

interface FAQItemData {
  id: string;
  question: string;
  answer: string;
}

interface FAQCategoryData {
  title: string;
  faqs: FAQItemData[];
}

// --- Static Data ---

const FAQ_CATEGORIES: FAQCategoryData[] = [
  {
    title: 'Getting Started',
    faqs: [
      {
        id: 'gs1', // Use more descriptive IDs
        question: 'What is Fantasy AI?',
        answer: 'Fantasy AI is an innovative platform that lets you chat with AI-powered characters in immersive, story-driven conversations. Create unique relationships and explore different narratives with characters from various genres and backgrounds.'
      },
      {
        id: 'gs2',
        question: 'How do I start a conversation?',
        answer: 'To start a conversation, simply browse through the available characters on the home screen, select one that interests you, and tap on their profile. This will take you to the chat interface where you can begin interacting with the character.'
      },
      {
        id: 'gs3',
        question: 'Is Fantasy AI free to use?',
        answer: 'Fantasy AI offers both free and premium features. Basic conversations with characters are free, but some advanced features and exclusive characters may require a subscription or in-app purchases.'
      }
    ]
  },
  {
    title: 'Account & Privacy',
    faqs: [
      {
        id: 'ap1',
        question: 'Are conversations private?',
        answer: 'Yes, your conversations with characters are private by default. We respect your privacy and do not share your conversation data with third parties. You can review our privacy policy for more details on how we handle your data.'
      },
      {
        id: 'ap2',
        question: 'How can I delete my account?',
        answer: 'To delete your account, go to Settings > Security Settings > Danger Zone. There you\'ll find the option to delete your account. Please note that account deletion is permanent and will remove all your data from our servers.'
      },
      {
        id: 'ap3',
        question: 'How do I change notification settings?',
        answer: 'You can manage notification preferences by going to Settings > Notification Settings. There, you can control what types of notifications you receive and how they are delivered.'
      }
    ]
  },
  {
    title: 'Features & Usage',
    faqs: [
      {
        id: 'fu1',
        question: 'Can I create my own character?',
        answer: 'Currently, character creation is not available in the app, but we are working on this feature for future updates. Stay tuned for announcements about character creation tools!'
      },
      {
        id: 'fu2',
        question: 'Can I use Fantasy AI offline?',
        answer: 'Fantasy AI requires an internet connection to function as it processes conversations through our servers. We recommend using the app with a stable internet connection for the best experience.'
      },
      {
        id: 'fu3',
        question: 'What devices is Fantasy AI available on?',
        answer: 'Fantasy AI is available on iOS and Android devices. We recommend using the latest version of your operating system for the best experience.'
      },
      {
        id: 'fu4',
        question: 'How do I report inappropriate content?',
        answer: 'If you encounter inappropriate content, please use the "Report a Problem" feature in the Help Center. Provide details about the issue, and our moderation team will review it promptly.'
      }
    ]
  }
];

// --- Helper Components ---

interface FAQItemProps {
  item: FAQItemData;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  colors: Record<string, string>;
}

function FAQItem({ item, isExpanded, onToggle, colors }: FAQItemProps) {
  return (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.faqItem,
        {
          backgroundColor: isExpanded ? colors.cardActive : colors.card,
          borderColor: colors.border
        }
      ]}
      onPress={() => onToggle(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.questionContainer}>
        <Text style={[styles.questionText, { color: colors.text }]}>
          {item.question}
        </Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.subText}
        />
      </View>

      {isExpanded && (
        <View style={styles.answerContainer}>
          <Text style={[styles.answerText, { color: colors.subText }]}>
            {item.answer}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

interface FAQCategoryProps {
  category: FAQCategoryData;
  categoryIndex: number;
  isExpanded: boolean;
  expandedItemIds: Record<string, boolean>;
  onToggleCategory: (index: number) => void;
  onToggleItem: (id: string) => void;
  colors: Record<string, string>;
}

function FAQCategory({
  category,
  categoryIndex,
  isExpanded,
  expandedItemIds,
  onToggleCategory,
  onToggleItem,
  colors
}: FAQCategoryProps) {
  return (
    <View style={styles.categoryContainer}>
      <TouchableOpacity
        style={[styles.categoryHeader, { borderColor: colors.border }]}
        onPress={() => onToggleCategory(categoryIndex)}
        activeOpacity={0.8}
      >
        <Text style={[styles.categoryTitle, { color: colors.text }]}>
          {category.title}
        </Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.subText}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.categoryContent}>
          {category.faqs.map((faqItem) => (
            <FAQItem
              key={faqItem.id}
              item={faqItem}
              isExpanded={!!expandedItemIds[faqItem.id]}
              onToggle={onToggleItem}
              colors={colors}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// --- Main Component ---

type FAQsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'FAQs'>;

interface FAQsScreenProps {
  navigation: FAQsScreenNavigationProp;
}

export default function FAQsScreen({ navigation }: FAQsScreenProps) {
  const { isDarkMode } = useContext(ThemeContext);
  const [expandedItemIds, setExpandedItemIds] = useState<Record<string, boolean>>({});
  const [expandedCategoryIndices, setExpandedCategoryIndices] = useState<Record<number, boolean>>(
    // Initialize with all categories expanded
    FAQ_CATEGORIES.reduce((acc, _, index) => {
      acc[index] = true;
      return acc;
    }, {} as Record<number, boolean>)
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredCategories, setFilteredCategories] = useState<FAQCategoryData[]>(FAQ_CATEGORIES);

  // Dynamic colors based on theme
  const colors = {
    background: isDarkMode ? '#121212' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    subText: isDarkMode ? '#AAAAAA' : '#666666',
    card: isDarkMode ? '#1E1E1E' : '#F5F5F5',
    cardActive: isDarkMode ? '#252525' : '#EFEFF5',
    border: isDarkMode ? '#333333' : '#E0E0E0',
    primary: isDarkMode ? '#3D8CFF' : '#4F46E5', // Consistent naming
    accent: isDarkMode ? '#3D8CFF' : '#4F46E5',
    inputBackground: isDarkMode ? '#2C2C2E' : '#F0F0F0', // Specific input background
  };

  // Filter FAQs based on search query
  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();

    if (query === '') {
      setFilteredCategories(FAQ_CATEGORIES);
      // Optionally reset expanded states when search is cleared
      // setExpandedItemIds({});
      // setExpandedCategoryIndices(FAQ_CATEGORIES.reduce((acc, _, index) => ({ ...acc, [index]: true }), {}));
      return;
    }

    const filtered = FAQ_CATEGORIES.map(category => ({
      ...category,
      faqs: category.faqs.filter(faq =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
      )
    })).filter(category => category.faqs.length > 0);

    setFilteredCategories(filtered);

    // Auto-expand categories and items that match the search
    const newExpandedItems: Record<string, boolean> = {};
    const newExpandedCategories: Record<number, boolean> = {};

    filtered.forEach((category, index) => {
      // Find original index to use for category expansion state
      const originalIndex = FAQ_CATEGORIES.findIndex(c => c.title === category.title);
      if (originalIndex !== -1) {
        newExpandedCategories[originalIndex] = true;
        category.faqs.forEach(faq => {
          newExpandedItems[faq.id] = true;
        });
      }
    });

    setExpandedItemIds(newExpandedItems);
    setExpandedCategoryIndices(prev => ({ ...prev, ...newExpandedCategories })); // Merge with existing expanded categories

  }, [searchQuery]);

  const handleToggleItem = useCallback((id: string) => {
    setExpandedItemIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  const handleToggleCategory = useCallback((index: number) => {
    setExpandedCategoryIndices(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const navigateToContact = useCallback(() => {
    navigation.navigate('ContactUs', undefined); // Pass undefined for params
  }, [navigation]);

  const navigateToHelpCenter = useCallback(() => {
    navigation.navigate('HelpCenter', undefined); // Pass undefined for params
  }, [navigation]);


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.headerContainer}>
          <Text style={[styles.headerText, { color: colors.text }]}>
            Frequently Asked Questions
          </Text>
          <Text style={[styles.subHeaderText, { color: colors.subText }]}>
            Find answers to common questions about Fantasy AI
          </Text>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={20} color={colors.subText} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search FAQs..."
            placeholderTextColor={colors.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={colors.subText} />
            </TouchableOpacity>
          )}
        </View>

        {/* FAQ List or No Results */}
        {filteredCategories.length === 0 && searchQuery.length > 0 ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={50} color={colors.subText} style={styles.noResultsIcon} />
            <Text style={[styles.noResultsText, { color: colors.text }]}>
              No results found for "{searchQuery}"
            </Text>
            <Text style={[styles.noResultsSubText, { color: colors.subText }]}>
              Try using different keywords or browse all categories.
            </Text>
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: colors.primary }]}
              onPress={handleClearSearch}
            >
              <Text style={styles.resetButtonText}>Clear Search</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.faqList}>
            {filteredCategories.map((category, index) => {
               // Find original index for state management
               const originalIndex = FAQ_CATEGORIES.findIndex(c => c.title === category.title);
               if (originalIndex === -1) return null; // Should not happen if data is consistent

               return (
                 <FAQCategory
                   key={originalIndex} // Use original index as key
                   category={category}
                   categoryIndex={originalIndex}
                   isExpanded={!!expandedCategoryIndices[originalIndex]}
                   expandedItemIds={expandedItemIds}
                   onToggleCategory={handleToggleCategory}
                   onToggleItem={handleToggleItem}
                   colors={colors}
                 />
               );
            })}
          </View>
        )}

        {/* Contact Support Section */}
        <View style={styles.contactSection}>
          <Text style={[styles.contactText, { color: colors.subText }]}>
            Can't find what you're looking for?
          </Text>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: colors.primary }]}
            onPress={navigateToContact}
            activeOpacity={0.8}
          >
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={navigateToHelpCenter}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back-outline" size={16} color={colors.subText} style={styles.backButtonIcon} />
          <Text style={[styles.backButtonText, { color: colors.subText }]}>
            Return to Help Center
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 24,
  },
  headerText: {
    fontSize: 26, // Consistent with HelpCenter
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subHeaderText: {
    fontSize: 16,
    lineHeight: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    paddingHorizontal: 12, // Horizontal padding
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: 48, // Defined height
  },
  clearButton: {
    padding: 8, // Easier to tap
    marginLeft: 4,
  },
  faqList: {
    marginBottom: 24,
  },
  categoryContainer: {
    marginBottom: 16,
    // Removed border here, applied to header
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14, // Increased padding
    borderBottomWidth: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  categoryContent: {
    marginTop: 12,
    paddingLeft: 8, // Slight indent for items within category
  },
  faqItem: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingRight: 12, // More space for icon
    lineHeight: 22,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4, // Space between question and answer
  },
  answerText: {
    fontSize: 15,
    lineHeight: 22,
  },
  contactSection: {
    alignItems: 'center',
    marginTop: 16, // Added margin top
    marginBottom: 24,
    paddingTop: 24, // Space above
    borderTopWidth: 1,
    borderColor: '#E0E0E0', // Use theme color if needed: colors.border
  },
  contactText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  contactButton: {
    paddingVertical: 12,
    paddingHorizontal: 32, // Consistent with HelpCenter
    borderRadius: 25, // Consistent
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600', // Consistent
  },
  backButton: {
    flexDirection: 'row', // Icon and text side-by-side
    alignItems: 'center',
    justifyContent: 'center', // Center align
    paddingVertical: 12, // Increased padding
    marginTop: 8,
  },
  backButtonIcon: {
    marginRight: 6,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500', // Slightly bolder
  },
  noResultsContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  noResultsIcon: {
    marginBottom: 20,
    opacity: 0.6,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsSubText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 24, // Adjusted padding
    borderRadius: 25, // Consistent
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600', // Consistent
  },
});