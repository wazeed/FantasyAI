import { supabase } from '../utils/supabase';
// Import the specific Profile type generated from the schema
import { Database } from '../types/database'; // Assuming this is the main export

// Define Profile based on the generated types
type Profile = Database['public']['Tables']['profiles']['Row'];
// Define Profile update type based on generated types
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * Get the user profile directly from Supabase.
 * Returns the profile if found, null if not found or on error.
 * @param userId - The ID of the user whose profile is to be fetched.
 * @returns A promise that resolves to the user's profile or null.
 */
export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*') // Select all columns for now, adjust if needed
      .eq('id', userId)
      .single(); // Use single() as 'id' is the primary key

    // Handle potential errors
    if (error && error.code !== 'PGRST116') { // PGRST116: No rows found (expected if profile doesn't exist yet)
      console.error('Error fetching user profile:', error.message);
      return null; // Return null on unexpected errors
    }

    // 'data' will be null if no row is found (PGRST116 or simply no match)
    return data;
  } catch (error) {
    // Catch any unexpected errors during the operation execution
    console.error('Unexpected error in getUserProfile:', error instanceof Error ? error.message : error);
    return null;
  }
};

/**
 * Update a user profile in the 'profiles' table.
 * @param userId - The ID of the user whose profile is to be updated.
 * @param updates - An object containing the profile fields to update.
 * @returns A promise that resolves to the updated profile or null on error.
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

    // Handle potential errors during the update operation
    if (error) {
      console.error('Error updating user profile:', error.message);
      return null; // Return null on error
    }

    return data; // Return the updated profile data
  } catch (error) {
    // Catch any unexpected errors during the operation execution
    console.error('Unexpected error in updateUserProfile:', error instanceof Error ? error.message : error);
    return null;
  }
};

// Note: createUserProfile is handled by the handle_new_user trigger in schema.sql.
// Note: updateUserPreferences, searchUsers, deleteUser functions were removed as they were commented out and not implemented.