import { supabase } from '../utils/supabase';
import { DatabaseService } from './databaseService';
import { CacheService } from './cacheService';
import { User } from '@supabase/supabase-js';
import { UserProfile, DatabaseError, QueryOptions, Json } from '../types/database';

const cache = CacheService.getInstance();
const USER_CACHE_TTL = 5; // Cache user profiles for 5 minutes

/**
 * Get the user profile with caching
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const cacheKey = `user:${userId}`;
  
  return cache.getOrCompute(
    cacheKey,
    async () => DatabaseService.getById('users', userId),
    USER_CACHE_TTL
  );
};

/**
 * Create a new user profile after signup
 */
export const createUserProfile = async (user: User): Promise<UserProfile | null> => {
  try {
    // Check if profile already exists
    const existingUser = await DatabaseService.getById('users', user.id);
    if (existingUser) {
      return existingUser;
    }

    // Ensure we have an email
    if (!user.email) {
      throw new Error('Email is required');
    }

    // Create new profile
    const newUser = {
      id: user.id,
      email: user.email,
      username: user.email.split('@')[0],
      display_name: user.user_metadata?.full_name || user.email.split('@')[0],
      avatar_url: user.user_metadata?.avatar_url || '',
    };
    
    const profile = await DatabaseService.insert('users', newUser);
    
    if (profile) {
      // Update cache with new profile
      cache.set(`user:${user.id}`, profile, USER_CACHE_TTL);
    }
    
    return profile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
};

/**
 * Update a user profile
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> => {
  try {
    const profile = await DatabaseService.update('users', userId, updates);
    
    if (profile) {
      // Update cache with new profile data
      cache.set(`user:${userId}`, profile, USER_CACHE_TTL);
    }
    
    return profile;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
};

/**
 * Update user preferences
 */
export const updateUserPreferences = async (
  userId: string,
  preferences: Record<string, any>
): Promise<boolean> => {
  try {
    const userData = await DatabaseService.getById('users', userId);
    if (!userData) return false;

    const currentPreferences = (userData.preferences as Record<string, any>) || {};
    const updatedPreferences = { ...currentPreferences, ...preferences };
    
    const profile = await DatabaseService.update('users', userId, {
      preferences: updatedPreferences as Json
    });
    
    if (profile) {
      // Update cache with new profile data
      cache.set(`user:${userId}`, profile, USER_CACHE_TTL);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return false;
  }
};

/**
 * Search users with pagination and filtering
 */
export const searchUsers = async (options?: QueryOptions) => {
  return DatabaseService.query('users', options);
};

/**
 * Delete user and all associated data
 */
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    // Use transaction to ensure all user data is deleted
    const result = await DatabaseService.transaction(async () => {
      // Delete user profile (this will cascade to other tables via RLS)
      const success = await DatabaseService.delete('users', userId);
      
      if (success) {
        // Clear user data from cache
        cache.delete(`user:${userId}`);
        
        // Delete user auth data from Supabase
        const { error } = await supabase.auth.admin.deleteUser(userId);
        if (error) throw error;
        
        return true;
      }
      
      return false;
    });
    
    return result || false;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
};

// Initialize cleanup interval for expired cache items
cache.startCleanupInterval(30); // Clean up every 30 minutes