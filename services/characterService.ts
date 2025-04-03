// Removed duplicate imports
import { Tables } from '../types/database'; // Import the Tables helper
import { getOrComputeCacheItem } from './cacheService';
import { DatabaseService } from './databaseService';

// Define Character type using the Tables helper
type Character = Tables<'characters'>;

// Removed UserCharacter interface as the table doesn't exist in schema

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
// Removed USER_CHARACTERS_CACHE_TTL constant

// Removed functions related to non-existent 'user_characters' table:
// - getUserCharacters
// - getFavoriteCharacters
// - getRecentCharacters
// - recordCharacterInteraction
// - toggleFavoriteCharacter

/**
 * Get a character by ID
 */
export const getCharacter = async (id: string): Promise<Character | null> => {
  const cacheKey = `character:${id}`;
  
  // Add type assertion to align with expected type
  return getOrComputeCacheItem(
    cacheKey,
    async () => DatabaseService.getById('characters', id),
    CHARACTER_CACHE_TTL
  ) as Promise<Character | null>; // Correctly placed assertion
// Removed extra closing parenthesis
};

/**
 * Get multiple characters by IDs
 */
export const getCharactersByIds = async (ids: string[]): Promise<Character[]> => {
  const results = await Promise.all(
    ids.map(id => getCharacter(id))
  );
  
  // Add explicit type 'Character | null' to the parameter
  return results.filter((char: Character | null): char is Character => char !== null);
};

/**
 * Search characters with filtering and pagination
 */
export const searchCharacters = async (options?: QueryOptions) => {
  return DatabaseService.query('characters', options);
};