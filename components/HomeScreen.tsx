import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import CategoryTile from './CategoryTile';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import * as characterService from '../services/characterService';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

// Define category type for type safety
interface Category {
  id: string;
  title: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  colors: string[];
  group: string;
}

// Define the Character type expected by ChatScreen (align with ChatScreen.tsx)
interface ChatCharacter {
  id: number;
  name: string;
  description?: string;
  avatar: ImageSourcePropType | string;
  tags?: string[];
  category?: string;
  openingMessage?: string;
  exampleQuestions?: string[];
  suggestedQuestions?: string[];
  greeting?: string;
  image_url?: string; // Keep if used for avatar logic
  model?: string; // Add model field
  system_prompt?: string; // Add system prompt field
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const { user, isSubscribed, credits } = useAuth();
  const { colors, styles: commonStyles } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const displayName = user?.email?.split('@')[0] || 'Alex';
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('%c HomeScreen mounted', 'background: #000; color: #bada55; font-size: 12px;');
    console.log('%c User info:', 'color: #3498db; font-weight: bold;', { 
      user: user ? 'Logged In' : 'Not Logged In',
      isSubscribed: isSubscribed || false,
      credits: credits || 0
    });
    
    return () => {
      console.log('%c HomeScreen unmounted', 'background: #000; color: #ff6b6b; font-size: 12px;');
    };
  }, [user, isSubscribed, credits]);

  const getWelcomeMessage = () => {
    return "Welcome back";
  };

  const handleCategoryPress = async (category: Category) => {
    try {
      console.log(`Category pressed: ${category.title}`);
      setIsLoading(true);

      // Fetch characters for the selected category
      // characterService returns type Tables<'characters'>
      const characters = await characterService.getCharactersByCategory(category.title.toLowerCase());

      let characterToPass: ChatCharacter; // Use the ChatCharacter interface

      if (characters && characters.length > 0) {
        const fetchedChar = characters[0]; // Type is Tables<'characters'>

        // Ensure ID is a number
        let characterId: number;
        const fetchedId = fetchedChar.id;
        if (typeof fetchedId === 'number' && !isNaN(fetchedId)) {
          characterId = fetchedId;
        } else if (typeof fetchedId === 'string') {
          const parsedId = parseInt(fetchedId, 10);
          characterId = !isNaN(parsedId) ? parsedId : parseInt(category.id, 10);
        } else {
          characterId = parseInt(category.id, 10);
        }

        console.log(`Navigating to chat with character: ${fetchedChar.name} (ID: ${characterId})`);

        // Construct the character object for navigation, including model and system_prompt
        characterToPass = {
          id: characterId,
          name: fetchedChar.name, // Assumed to exist based on schema
          description: fetchedChar.description || category.description, // Fallback to category description
          avatar: fetchedChar.image_url ? { uri: fetchedChar.image_url } : require('../assets/profile-placeholder.png'),
          tags: [category.group], // Default tag
          category: category.title, // Default category
          openingMessage: fetchedChar.greeting || `Hello! I'm ${fetchedChar.name}. How can I help?`, // Use greeting or generate default
          exampleQuestions: [ // Generic examples
            `Tell me more about yourself.`,
            `What can you help me with?`
          ],
          suggestedQuestions: [], // Default empty
          greeting: fetchedChar.greeting || `Hello! I'm ${fetchedChar.name}.`, // Use greeting or generate default
          image_url: fetchedChar.image_url || undefined, // Pass along if exists
          model: fetchedChar.model || undefined, // Pass model if available
          system_prompt: fetchedChar.system_prompt || undefined // Pass system_prompt if available
        };

      } else {
        // Fallback for when no specific characters are found
        const characterId = parseInt(category.id, 10);
        console.log(`No specific characters found for ${category.title}, using fallback (ID: ${characterId})`);

        characterToPass = {
          id: characterId,
          name: category.title,
          description: category.description,
          avatar: require('../assets/profile-placeholder.png'),
          tags: [category.group],
          category: category.group,
          openingMessage: `Hello! I'm your ${category.title} assistant. How can I help you today?`,
          exampleQuestions: [
            `Tell me about ${category.title}`,
            `How can you help me with ${category.title}?`,
            `What tips do you have about ${category.title}?`
          ],
          suggestedQuestions: [
            `What are the best practices for ${category.title.toLowerCase()}?`,
            `How can I improve my ${category.title.toLowerCase()} skills?`,
            `What are common mistakes in ${category.title.toLowerCase()}?`
          ],
          greeting: `Hello! I'm your ${category.title} assistant. I'm here to help with all your ${category.title.toLowerCase()} needs!`,
          // No specific model or system_prompt for fallback characters
          model: undefined,
          system_prompt: undefined
        };
      }

      // Navigate with the constructed character object
      navigation.navigate('Chat', { character: characterToPass });

    } catch (error) {
      console.error('Error handling category press:', error);
      Alert.alert(
        "Connection Error",
        "Could not load the chat. Please try again later.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const categories: Category[] = [
    {
      id: '1',
      title: 'Self-Growth',
      description: 'Become a better version of yourself',
      iconName: 'medal-outline',
      colors: ['#00B894', '#00CEC9'],
      group: 'Personal'
    },
    {
      id: '2',
      title: 'Lifestyle',
      description: 'Fill your life with purpose and joy',
      iconName: 'sunny-outline',
      colors: ['#FDCB6E', '#FFA502'],
      group: 'Personal'
    },
    {
      id: '3',
      title: 'Spirituality',
      description: 'Enrich your life with wisdom',
      iconName: 'sparkles-outline',
      colors: ['#00B894', '#6FCF97'],
      group: 'Personal'
    },
    {
      id: '4',
      title: 'Fitness',
      description: 'Achieve your fitness goals',
      iconName: 'fitness-outline',
      colors: ['#FF7675', '#FF6B81'],
      group: 'Health'
    },
    {
      id: '13',
      title: 'Nutrition',
      description: 'Eat healthy and feel great',
      iconName: 'nutrition-outline',
      colors: ['#4CD137', '#7CEC73'],
      group: 'Health'
    },
    {
      id: '5',
      title: 'Career',
      description: 'Get your work done faster',
      iconName: 'briefcase-outline',
      colors: ['#9B59B6', '#8E44AD'],
      group: 'Professional'
    },
    {
      id: '6',
      title: 'Emails',
      description: 'Craft emails in seconds',
      iconName: 'mail-outline',
      colors: ['#3498DB', '#2ED9C3'],
      group: 'Professional'
    },
    {
      id: '7',
      title: 'Relationships',
      description: 'Build stronger connections',
      iconName: 'heart-outline',
      colors: ['#FF6B6B', '#FF4757'],
      group: 'Personal'
    },
    {
      id: '8',
      title: 'Mental Health',
      description: 'Calm your mind and reduce stress',
      iconName: 'medical-outline', // Changed from 'brain-outline' to a valid icon
      colors: ['#74B9FF', '#0984E3'],
      group: 'Health'
    },
    {
      id: '9',
      title: 'Finance',
      description: 'Manage your money efficiently',
      iconName: 'cash-outline',
      colors: ['#2ECC71', '#27AE60'],
      group: 'Professional'
    },
    {
      id: '10',
      title: 'Education',
      description: 'Learn new skills and concepts',
      iconName: 'book-outline',
      colors: ['#E84393', '#D63031'],
      group: 'Professional'
    },
    {
      id: '11',
      title: 'Creativity',
      description: 'Unlock your creative potential',
      iconName: 'color-palette-outline',
      colors: ['#A29BFE', '#6C5CE7'],
      group: 'Personal'
    },
    {
      id: '12',
      title: 'Productivity',
      description: 'Get more done in less time',
      iconName: 'timer-outline',
      colors: ['#FD79A8', '#E84393'],
      group: 'Professional'
    }
  ];

  const categoryGroups = ['All', ...new Set(categories.map(cat => cat.group))];

  // Memoize styles to prevent recreation on every render unless colors change
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
      paddingHorizontal: 16,
    },
    header: {
      marginTop: 20,
      marginBottom: 28,
    },
    greeting: {
      fontSize: 28, // Further reduced font size
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6, // Slightly reduced margin
    },
    subheading: {
      fontSize: 18,
      color: colors.secondaryText,
      fontWeight: '400',
      marginBottom: 8,
    },
    creditsCounter: {
      fontSize: 16,
      color: colors.success,
      fontWeight: '500',
    },
    filterContainer: {
      marginBottom: 24,
    },
    filterScroll: {
      paddingVertical: 8,
    },
    filterButton: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 24,
      marginRight: 12,
      backgroundColor: colors.cardBg,
    },
    filterButtonSelected: {
      backgroundColor: colors.primary,
    },
    filterButtonText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '500',
    },
    filterButtonTextSelected: {
      color: colors.buttonText,
      fontWeight: '600',
    },
    tilesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingBottom: 24,
    },
    tileContainer: {
      width: '48%',
      marginBottom: 16,
      aspectRatio: 1.2,
      height: undefined,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
  }), [colors]);

  const renderCategoryTile = (category: Category) => {
    console.log(`Rendering category tile: ${category.title}`);
    return (
      <View key={category.id} style={styles.tileContainer}>
        <CategoryTile
          title={category.title}
          subtitle={category.description}
          iconName={category.iconName}
          colors={category.colors} // Keep original gradient colors for tiles
          onPress={() => handleCategoryPress(category)}
          onPressIn={() => console.log(`Category tile pressed in: ${category.title}`)}
          onPressOut={() => console.log(`Category tile pressed out: ${category.title}`)}
        />
      </View>
    );
  };

  const filteredCategories = selectedCategory === 'All' 
    ? categories 
    : categories.filter(cat => cat.group === selectedCategory);

  const renderCategoryFilter = (group: string) => {
    const isSelected = selectedCategory === group;
    return (
      <TouchableOpacity
        key={group}
        style={[
          styles.filterButton,
          isSelected && styles.filterButtonSelected
        ]}
        onPress={() => setSelectedCategory(group)}
      >
        <Text style={[
          styles.filterButtonText,
          isSelected && styles.filterButtonTextSelected
        ]}>
          {group}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.greeting}>
              {getWelcomeMessage()}
            </Text>
            <Text style={styles.subheading}>
              Explore your path to growth
            </Text>
            {credits !== null && (
              <Text style={styles.creditsCounter}>
                Credits: {credits}
              </Text>
            )}
          </View>
          
          <View style={styles.filterContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {categoryGroups.map(renderCategoryFilter)}
            </ScrollView>
          </View>
          
          <View style={styles.tilesGrid}>
            {filteredCategories.map(renderCategoryTile)}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default HomeScreen;