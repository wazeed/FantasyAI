import { supabase } from '../utils/supabase';
import { User } from '@supabase/supabase-js';
// Import the specific Profile type generated from the schema
import { Database } from '../types/database'; // Assuming this is the main export

// Define Profile based on the generated types
type Profile = Database['public']['Tables']['profiles']['Row'];
// Define Profile update type based on generated types
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// Removed CacheService and DatabaseService imports as we'll use supabase client directly

/**
 * Get the user profile directly from Supabase.
 */
export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*') // Select all columns for now, adjust if needed
      .eq('id', userId)
      .single(); // Use single() as 'id' is the primary key

    if (error && error.code !== 'PGRST116') { // PGRST116: No rows found, which is okay if profile not created yet
      console.error('Error fetching user profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

/**
 * createUserProfile is no longer needed here as the handle_new_user trigger
 * in schema.sql automatically creates a profile row upon user signup.
 */
// export const createUserProfile = async (user: User): Promise<Profile | null> => { ... };

/**
 * Update a user profile in the 'profiles' table.
 */
export const updateUserProfile = async (
  userId: string,
  updates: ProfileUpdate // Use the generated Update type
): Promise<Profile | null> => {
  try {
    // Ensure updated_at is set automatically by the trigger, no need to set it here
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select() // Select the updated row
      .single(); // Expecting a single row back

    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }

    // No need to manually update cache for now
    // if (data) {
    //   cache.set(`user:${userId}`, data, USER_CACHE_TTL);
    // }

    return data;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return null;
  }
};

/**
 * Update user preferences - Commented out for now, needs review based on schema
 */
/*
export const updateUserPreferences = async (
  userId: string,
  preferences: Record<string, any>
): Promise<boolean> => {
  try {
    // This needs adjustment if 'preferences' column doesn't exist or has a different structure
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({ preferences: preferences as Json }) // Cast might be needed depending on final type
      .eq('id', userId)
      .select('id') // Only select id to confirm update
      .single();

    if (updateError) throw updateError;

    return !!profile; // Return true if update was successful

  } catch (error) {
    console.error('Error updating user preferences:', error);
    return false;
  }
};
*/

/**
 * Search users - Commented out for now, needs review based on schema/requirements
 */
/*
export const searchUsers = async (options?: QueryOptions) => {
  // This needs adjustment to query 'profiles' table and handle options correctly
  // return DatabaseService.query('profiles', options);
  console.warn('searchUsers function needs implementation for profiles table');
  return [];
};
*/

/**
 * Delete user and all associated data - Commented out, requires careful handling
 */
/*
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    // Deleting from auth.users should cascade delete the profile due to FOREIGN KEY constraint
    // However, deleting via admin API is safer and cleaner
    const { error: adminError } = await supabase.auth.admin.deleteUser(userId);

    if (adminError) {
      console.error('Error deleting user from auth:', adminError);
      // Attempt to delete from profiles table as fallback? Risky.
      // const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);
      // if (profileError) {
      //   console.error('Error deleting profile directly:', profileError);
      //   throw adminError; // Re-throw original error
      // }
      throw adminError;
    }

    // Clear cache if used
    // cache.delete(`user:${userId}`);

    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
};
*/

// Removed cache initialization and cleanup interval
// const cache = CacheService.getInstance();
// const USER_CACHE_TTL = 5;
// cache.startCleanupInterval(30);