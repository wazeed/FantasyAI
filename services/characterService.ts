import { DatabaseService } from './databaseService';
import { CacheService } from './cacheService';
import { Character, UserCharacter, QueryOptions } from '../types/database';

const cache = CacheService.getInstance();
const CHARACTER_CACHE_TTL = 30; // Cache characters for 30 minutes
const USER_CHARACTERS_CACHE_TTL = 5; // Cache user-character relationships for 5 minutes

// Type for creating new user-character relationship
type CreateUserCharacter = Omit<UserCharacter, 'id' | 'created_at' | 'updated_at'>;

/**
 * Get all user-character relationships for a user
 */
export const getUserCharacters = async (userId: string): Promise<UserCharacter[]> => {
  const cacheKey = `user:${userId}:characters`;
  
  const result = await cache.getOrCompute(
    cacheKey,
    async () => {
      const result = await DatabaseService.query('user_characters', {
        filters: [{ column: 'user_id', operator: '=', value: userId }]
      });
      return result.data;
    },
    USER_CHARACTERS_CACHE_TTL
  );
  
  return result || [];
};

/**
 * Get favorite characters for a user
 */
export const getFavoriteCharacters = async (userId: string): Promise<UserCharacter[]> => {
  const cacheKey = `user:${userId}:favorites`;
  
  const result = await cache.getOrCompute(
    cacheKey,
    async () => {
      const result = await DatabaseService.query('user_characters', {
        filters: [
          { column: 'user_id', operator: '=', value: userId },
          { column: 'is_favorite', operator: '=', value: true }
        ],
        orderBy: { column: 'updated_at', direction: 'desc' }
      });
      return result.data;
    },
    USER_CHARACTERS_CACHE_TTL
  );
  
  return result || [];
};

/**
 * Get recently interacted characters for a user
 */
export const getRecentCharacters = async (userId: string, limit: number = 5): Promise<UserCharacter[]> => {
  const cacheKey = `user:${userId}:recent:${limit}`;
  
  const result = await cache.getOrCompute(
    cacheKey,
    async () => {
      const result = await DatabaseService.query('user_characters', {
        filters: [
          { column: 'user_id', operator: '=', value: userId },
          { column: 'last_interaction', operator: '!=', value: null }
        ],
        orderBy: { column: 'last_interaction', direction: 'desc' },
        limit
      });
      return result.data;
    },
    USER_CHARACTERS_CACHE_TTL
  );
  
  return result || [];
};

/**
 * Record an interaction with a character
 */
export const recordCharacterInteraction = async (
  userId: string,
  characterId: string
): Promise<UserCharacter | null> => {
  try {
    const now = new Date().toISOString();
    
    // Check if relationship already exists
    const existingRelation = await DatabaseService.query('user_characters', {
      filters: [
        { column: 'user_id', operator: '=', value: userId },
        { column: 'character_id', operator: '=', value: characterId }
      ]
    });
    
    let result: UserCharacter | null;
    
    if (existingRelation.data.length > 0) {
      // Update existing relationship
      result = await DatabaseService.update('user_characters', existingRelation.data[0].id, {
        last_interaction: now,
        interaction_count: existingRelation.data[0].interaction_count + 1
      });
    } else {
      // Create new relationship
      const newRelation: CreateUserCharacter = {
        user_id: userId,
        character_id: characterId,
        last_interaction: now,
        interaction_count: 1,
        is_favorite: false
      };
      
      result = await DatabaseService.insert('user_characters', newRelation);
    }
    
    if (result) {
      // Invalidate relevant caches
      cache.delete(`user:${userId}:characters`);
      cache.delete(`user:${userId}:recent:5`);
    }
    
    return result;
  } catch (error) {
    console.error('Error recording character interaction:', error);
    return null;
  }
};

/**
 * Toggle favorite status for a character
 */
export const toggleFavoriteCharacter = async (
  userId: string,
  characterId: string,
  isFavorite: boolean
): Promise<boolean> => {
  try {
    // Check if relationship exists
    const existingRelation = await DatabaseService.query('user_characters', {
      filters: [
        { column: 'user_id', operator: '=', value: userId },
        { column: 'character_id', operator: '=', value: characterId }
      ]
    });
    
    let success = false;
    
    if (existingRelation.data.length > 0) {
      // Update existing relationship
      const result = await DatabaseService.update('user_characters', existingRelation.data[0].id, {
        is_favorite: isFavorite
      });
      success = !!result;
    } else {
      // Create new relationship
      const newRelation: CreateUserCharacter = {
        user_id: userId,
        character_id: characterId,
        is_favorite: isFavorite,
        interaction_count: 0,
        last_interaction: null
      };
      
      const result = await DatabaseService.insert('user_characters', newRelation);
      success = !!result;
    }
    
    if (success) {
      // Invalidate relevant caches
      cache.delete(`user:${userId}:characters`);
      cache.delete(`user:${userId}:favorites`);
    }
    
    return success;
  } catch (error) {
    console.error('Error toggling favorite character:', error);
    return false;
  }
};

/**
 * Get a character by ID
 */
export const getCharacter = async (id: string): Promise<Character | null> => {
  const cacheKey = `character:${id}`;
  
  return cache.getOrCompute(
    cacheKey,
    async () => DatabaseService.getById('characters', id),
    CHARACTER_CACHE_TTL
  );
};

/**
 * Get multiple characters by IDs
 */
export const getCharactersByIds = async (ids: string[]): Promise<Character[]> => {
  const results = await Promise.all(
    ids.map(id => getCharacter(id))
  );
  
  return results.filter((char): char is Character => char !== null);
};

/**
 * Search characters with filtering and pagination
 */
export const searchCharacters = async (options?: QueryOptions) => {
  return DatabaseService.query('characters', options);
};