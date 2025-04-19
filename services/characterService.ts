import { Database } from '../types/database'; // Ensure Database type is imported for Enum access
import { AI_MODELS, CHARACTER_PROMPTS } from '../utils/aiConfig'; // Added import
import { Tables } from '../types/database'; // Import the Tables helper
import { getOrComputeCacheItem } from './cacheService';
import { DatabaseService } from './databaseService';

// Define Character type using the Tables helper
// Ensure this type aligns with the actual 'characters' table schema
type CharacterFromDB = Tables<'characters'>; // Type strictly from DB schema

type Character = CharacterFromDB & {
  // Manually add fields expected by the application but potentially not in DB schema directly
  category?: string; // Keep for application logic if needed
  avatar?: any; // Allow require() or string URI
  tags?: string[];
  openingMessage?: string;
  // greeting is already in CharacterFromDB, ensure it allows null/undefined
  model?: string;
  system_prompt?: string;
};

// Define QueryOptions locally based on usage in DatabaseService
interface QueryFilter {
  column: string;
  operator: string;
  value: any;
}

interface QueryOrderBy {
  column: string;
  direction: 'asc' | 'desc';
}

interface QueryOptions {
  filters?: QueryFilter[];
  orderBy?: QueryOrderBy;
  limit?: number;
  offset?: number;
}

const CHARACTER_CACHE_TTL = 30; // Cache characters for 30 minutes

// Define default characters for categories that might not be in the database
// Adjusted to align better with the inferred Character type and fix errors
const defaultCharactersByCategory: Record<string, Character[]> = {
  nutrition: [
    {
      id: -1,
      name: 'Chef Nourish',
      description: 'Your go-to expert for delicious and healthy recipes.',
      type: 'wellness_guide',
      category: 'Nutrition',
      avatar: require('../assets/profile-placeholder.png'), // Corrected path to placeholder
      model: AI_MODELS.default,
      system_prompt: CHARACTER_PROMPTS.getDefaultPrompt('Chef Nourish', 'Your go-to expert for delicious and healthy recipes.'),
      tags: ['recipes', 'healthy eating', 'meal planning'],
      openingMessage: 'Ready to cook up something healthy and tasty?',
      greeting: 'Hi there! I\'m Chef Nourish.',
      image_url: null,
    },
    {
      id: -2,
      name: 'Dietitian Deb',
      description: 'Personalized dietary advice and meal plans.',
      type: 'wellness_guide',
      category: 'Nutrition',
      avatar: require('../assets/profile-placeholder.png'), // Corrected path to placeholder
      model: AI_MODELS.default,
      system_prompt: CHARACTER_PROMPTS.getDefaultPrompt('Dietitian Deb', 'Personalized dietary advice and meal plans.'),
      tags: ['diet', 'meal plan', 'nutritionist'],
      openingMessage: 'Let\'s create a nutrition plan that works for you!',
      greeting: 'Hello, I\'m Dietitian Deb.',
      image_url: null,
    },
    {
      id: -3,
      name: 'Supplement Sam',
      description: 'Information on vitamins, minerals, and supplements.',
      type: 'wellness_guide',
      category: 'Nutrition',
      avatar: require('../assets/profile-placeholder.png'), // Corrected path to placeholder
      model: AI_MODELS.default,
      system_prompt: CHARACTER_PROMPTS.getDefaultPrompt('Supplement Sam', 'Information on vitamins, minerals, and supplements.'),
      tags: ['supplements', 'vitamins', 'minerals'],
      openingMessage: 'Curious about supplements? Ask me anything!',
      greeting: 'Hey! Supplement Sam here.',
      image_url: null,
    },
  ],
  // Add other categories and their default characters as needed
};

/**
 * Define an extended character type that includes AI fields
 */
interface ExtendedCharacter extends Character {
  model?: string;
  system_prompt?: string;
}

// Helper function to enhance characters with OpenRouter fields
export const enhanceWithAIFields = (character: Character): ExtendedCharacter => {
  // Create a new object with the existing character properties
  const enhanced = { ...character } as ExtendedCharacter;
  
  // Add model field if not present
  const modelMap: Record<string, string> = {
    // Default for all character types
    'default': 'openai/gpt-3.5-turbo'
  };
  
  // Set model based on character type or use default
  enhanced.model = character.type && typeof character.type === 'string' && character.type in modelMap
    ? modelMap[character.type]
    : modelMap.default;
  
  // Generate a default system prompt
  let typeSpecificPrompt = '';
  
  // Check character type in a type-safe way without comparison errors
  if (character.type === 'life_coach') {
    typeSpecificPrompt = 'Offer motivational and supportive guidance.';
  } else if (character.type === 'creative_buddy') {
    typeSpecificPrompt = 'Be imaginative and inspiring in your responses.';
  } else if (character.type && typeof character.type === 'string') {
    // Handle other types in a more generic way
    typeSpecificPrompt = `Focus on providing helpful ${character.type.replace('_', ' ')} advice.`;
  }
  
  enhanced.system_prompt = `You are ${character.name}, ${character.description || 'an AI assistant'}. 
Your goal is to provide helpful, accurate, and friendly responses.
${typeSpecificPrompt}
Always respond in character and help users achieve their goals.`;
  
  return enhanced;
};

/**
 * Get a character by ID, enhanced with AI fields
 */
export const getCharacter = async (id: string): Promise<ExtendedCharacter | null> => {
  const cacheKey = `character:${id}`;

  // Fetch the raw DB character data
  const characterFromDB = await getOrComputeCacheItem<CharacterFromDB | null>(
    cacheKey,
    async () => DatabaseService.getById('characters', id),
    CHARACTER_CACHE_TTL
  );

  // Enhance character if found
  return characterFromDB ? enhanceWithAIFields(characterFromDB) : null;
};

/**
 * Get multiple characters by IDs, enhanced with AI fields
 */
export const getCharactersByIds = async (ids: string[]): Promise<ExtendedCharacter[]> => {
  const results = await Promise.all(
    ids.map(id => getCharacter(id))
  );
  
  return results.filter((char): char is ExtendedCharacter => char !== null);
};

/**
 * Add a mapping for categories to valid enum types
 */
const categoryToEnumTypeMap: Record<string, Database['public']['Enums']['character_type']> = {
  'fitness': 'wellness_guide',
  'nutrition': 'wellness_guide',
  'mental health': 'wellness_guide',
  'career': 'career_helper',
  'education': 'study_partner',
  'creativity': 'creative_buddy',
  'productivity': 'problem_solver',
  'relationships': 'social_coach',
  'finance': 'problem_solver',
  'lifestyle': 'life_coach', // Added mapping for Lifestyle
  'spirituality': 'wellness_guide', // Added mapping for Spirituality
  // Add other necessary mappings here based on your categories and enum definition
};

/**
 * Get characters by category, enhanced with AI fields
 */
export const getCharactersByCategory = async (category: string): Promise<ExtendedCharacter[]> => {
  const cacheKey = `characters:category:${category}`;
  // Normalize category input for lookup and use in default character fallback
  const normalizedCategory = category.toLowerCase();
  // Get the mapped enum type for the database query
  const enumType = categoryToEnumTypeMap[normalizedCategory];

  if (!enumType) {
      console.warn(`[getCharactersByCategory] No valid enum type mapping found for category: '${category}'. Will rely on default characters if available.`);
  }

  let characters: ExtendedCharacter[] = [];

  try {
    // Fetch raw DB characters or defaults
    const cachedResult = await getOrComputeCacheItem<CharacterFromDB[] | null>(
      cacheKey,
      async () => {
        // Only attempt DB query if we have a valid mapped enum type
        if (enumType) {
            try {
              const options: QueryOptions = {
                filters: [
                  {
                    column: 'type', // Querying the 'type' column
                    operator: 'eq',
                    value: enumType // Use the mapped enum type
                  }
                ],
                limit: 10 // Keep limit or adjust as needed
              };

              console.log(`[getCharactersByCategory] Querying DB for type: '${enumType}' (mapped from category: '${category}')`);
              const result = await DatabaseService.query('characters', options);

              // If we have results from the database, return them
              if (result && result.data && result.data.length > 0) {
                console.log(`[getCharactersByCategory] Found ${result.data.length} characters in DB for type: '${enumType}'`);
                return result.data;
              } else {
                 console.log(`[getCharactersByCategory] No characters found in DB for type: '${enumType}'. Checking defaults.`);
              }
            } catch (dbError) {
               console.error(`[getCharactersByCategory] Error querying DB for type '${enumType}':`, dbError);
               // Proceed to default characters if DB query fails
            }
        } else {
             console.log(`[getCharactersByCategory] Skipping DB query for category '${category}' due to missing enum mapping.`);
        }

        // Fallback to default characters if no DB results or no valid enum type mapping
        // Use normalizedCategory for looking up defaults
        if (defaultCharactersByCategory[normalizedCategory]) {
          console.log(`[getCharactersByCategory] Using default characters for category: ${normalizedCategory}`);
          // Ensure default characters align with CharacterFromDB where possible
          return defaultCharactersByCategory[normalizedCategory] as unknown as CharacterFromDB[];
        }

        // If no DB results and no defaults, return empty array
        console.log(`[getCharactersByCategory] No DB results and no default characters found for category: ${normalizedCategory}`);
        return [];
      },
      CHARACTER_CACHE_TTL
    );

    // Enhance characters (CharacterFromDB[]) with AI fields
    characters = (cachedResult || []).map(character => enhanceWithAIFields(character));

  } catch (error) {
    console.error(`[getCharactersByCategory] Unexpected error processing category '${category}':`, error);
    characters = []; // Return empty array in case of error
  }

  console.log(`[getCharactersByCategory] Returning ${characters.length} enhanced characters for category: ${category}`);
  return characters;
};

/**
 * Search characters with filtering and pagination, enhanced with AI fields
 */
export const searchCharacters = async (options?: QueryOptions) => {
  const result = await DatabaseService.query('characters', options);

  // Enhance characters (CharacterFromDB[]) with AI fields
  if (result && result.data) {
    // The map function expects CharacterFromDB, enhanceWithAIFields takes CharacterFromDB
    const enhancedData = result.data.map(character => enhanceWithAIFields(character));
    // Return the enhanced data structure
    return {
      ...result,
      data: enhancedData,
    };
  }

  return result; // Return original result if data is missing
}