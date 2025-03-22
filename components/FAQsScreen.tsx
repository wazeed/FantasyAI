import React, { useState, useEffect } from 'react';
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

// Organized FAQ data by categories
const FAQ_CATEGORIES = [
  {
    title: 'Getting Started',
    faqs: [
      {
        id: '1',
        question: 'What is Fantasy AI?',
        answer: 'Fantasy AI is an innovative platform that lets you chat with AI-powered characters in immersive, story-driven conversations. Create unique relationships and explore different narratives with characters from various genres and backgrounds.'
      },
      {
        id: '2',
        question: 'How do I start a conversation?',
        answer: 'To start a conversation, simply browse through the available characters on the home screen, select one that interests you, and tap on their profile. This will take you to the chat interface where you can begin interacting with the character.'
      },
      {
        id: '3',
        question: 'Is Fantasy AI free to use?',
        answer: 'Fantasy AI offers both free and premium features. Basic conversations with characters are free, but some advanced features and exclusive characters may require a subscription or in-app purchases.'
      }
    ]
  },
  {
    title: 'Account & Privacy',
    faqs: [
      {
        id: '4',
        question: 'Are conversations private?',
        answer: 'Yes, your conversations with characters are private by default. We respect your privacy and do not share your conversation data with third parties. You can review our privacy policy for more details on how we handle your data.'
      },
      {
        id: '5',
        question: 'How can I delete my account?',
        answer: 'To delete your account, go to Settings > Security Settings > Danger Zone. There you\'ll find the option to delete your account. Please note that account deletion is permanent and will remove all your data from our servers.'
      },
      {
        id: '6',
        question: 'How do I change notification settings?',
        answer: 'You can manage notification preferences by going to Settings > Notification Settings. There, you can control what types of notifications you receive and how they are delivered.'
      }
    ]
  },
  {
    title: 'Features & Usage',
    faqs: [
      {
        id: '7',
        question: 'Can I create my own character?',
        answer: 'Currently, character creation is not available in the app, but we are working on this feature for future updates. Stay tuned for announcements about character creation tools!'
      },
      {
        id: '8',
        question: 'Can I use Fantasy AI offline?',
        answer: 'Fantasy AI requires an internet connection to function as it processes conversations through our servers. We recommend using the app with a stable internet connection for the best experience.'
      },
      {
        id: '9',
        question: 'What devices is Fantasy AI available on?',
        answer: 'Fantasy AI is available on iOS and Android devices. We recommend using the latest version of your operating system for the best experience.'
      },
      {
        id: '10',
        question: 'How do I report inappropriate content?',
        answer: 'If you encounter inappropriate content, please use the "Report a Problem" feature in the Help Center. Provide details about the issue, and our moderation team will review it promptly.'
      }
    ]
  }
];

export default function FAQsScreen({ navigation }) {
  const { isDarkMode } = React.useContext(ThemeContext);
  const [expandedItems, setExpandedItems] = useState({});
  const [expandedCategories, setExpandedCategories] = useState(
    FAQ_CATEGORIES.reduce((acc, category, index) => {
      acc[index] = true; // Start with all categories expanded
      return acc;
    }, {})
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFAQs, setFilteredFAQs] = useState(FAQ_CATEGORIES);

  // Dynamic colors based on theme
  const colors = {
    background: isDarkMode ? '#121212' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    subText: isDarkMode ? '#AAAAAA' : '#666666',
    card: isDarkMode ? '#1E1E1E' : '#F5F5F5',
    cardActive: isDarkMode ? '#252525' : '#EFEFF5',
    border: isDarkMode ? '#333333' : '#E0E0E0',
    primary: isDarkMode ? '#3D8CFF' : '#4F46E5',
    accent: isDarkMode ? '#3D8CFF' : '#4F46E5',
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFAQs(FAQ_CATEGORIES);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    
    // Filter FAQs based on search query
    const filtered = FAQ_CATEGORIES.map(category => {
      const matchingFaqs = category.faqs.filter(faq => 
        faq.question.toLowerCase().includes(query) || 
        faq.answer.toLowerCase().includes(query)
      );
      
      return {
        ...category,
        faqs: matchingFaqs
      };
    }).filter(category => category.faqs.length > 0);
    
    setFilteredFAQs(filtered);
    
    // Auto-expand items with search results
    const newExpandedItems = {};
    const newExpandedCategories = {};
    
    filtered.forEach((category, index) => {
      newExpandedCategories[index] = true;
      category.faqs.forEach(faq => {
        newExpandedItems[faq.id] = true;
      });
    });
    
    setExpandedItems(newExpandedItems);
    setExpandedCategories(newExpandedCategories);
  }, [searchQuery]);

  const toggleFAQ = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleCategory = (index) => {
    setExpandedCategories(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const renderFAQItem = (item) => {
    const isExpanded = expandedItems[item.id];
    
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
        onPress={() => toggleFAQ(item.id)}
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
  };

  const renderFAQCategory = (category, index) => {
    const isExpanded = expandedCategories[index];

    return (
      <View key={index} style={styles.categoryContainer}>
        <TouchableOpacity 
          style={[styles.categoryHeader, { borderColor: colors.border }]}
          onPress={() => toggleCategory(index)}
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
            {category.faqs.map(renderFAQItem)}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={[styles.headerText, { color: colors.text }]}>
            Frequently Asked Questions
          </Text>
          <Text style={[styles.subHeaderText, { color: colors.subText }]}>
            Find answers to common questions about Fantasy AI
          </Text>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={20} color={colors.subText} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search FAQs..."
            placeholderTextColor={colors.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={colors.subText} />
            </TouchableOpacity>
          )}
        </View>

        {filteredFAQs.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={50} color={colors.subText} style={styles.noResultsIcon} />
            <Text style={[styles.noResultsText, { color: colors.text }]}>
              No results found
            </Text>
            <Text style={[styles.noResultsSubText, { color: colors.subText }]}>
              Try using different keywords or browse all categories
            </Text>
            <TouchableOpacity 
              style={[styles.resetButton, { backgroundColor: colors.primary }]}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.resetButtonText}>Clear Search</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.faqList}>
            {filteredFAQs.map(renderFAQCategory)}
          </View>
        )}

        <View style={styles.contactSection}>
          <Text style={[styles.contactText, { color: colors.subText }]}>
            Can't find what you're looking for?
          </Text>
          <TouchableOpacity 
            style={[styles.contactButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('ContactUs')}
          >
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('HelpCenter')}
        >
          <Text style={[styles.backButtonText, { color: colors.subText }]}>
            Return to Help Center
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

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
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subHeaderText: {
    fontSize: 16,
    lineHeight: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    paddingLeft: 10,
  },
  clearButton: {
    padding: 8,
  },
  faqList: {
    marginBottom: 24,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  categoryContent: {
    marginTop: 12,
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
    paddingRight: 8,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  answerText: {
    fontSize: 15,
    lineHeight: 22,
  },
  contactSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  contactText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  contactButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 14,
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
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
}); 